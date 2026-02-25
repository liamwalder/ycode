'use client';

/**
 * Node view for the richTextComponent Tiptap block.
 * Renders a collapsible panel with the component name, and override
 * controls for each variable the component exposes.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { useComponentsStore } from '@/stores/useComponentsStore';
import { useEditorStore } from '@/stores/useEditorStore';
import {
  extractTiptapFromComponentVariable,
} from '@/lib/variable-utils';
import { isCircularComponentReference } from '@/lib/component-utils';
import ComponentVariableOverrides from './ComponentVariableOverrides';
import type { CollectionField, Collection } from '@/types';
import type { RichTextComponentOverrides } from '@/lib/tiptap-extensions/rich-text-component';
import type { FieldGroup } from '@/lib/collection-field-utils';

interface RichTextComponentBlockProps {
  componentId: string;
  componentOverrides: RichTextComponentOverrides;
  onOverridesChange: (overrides: RichTextComponentOverrides) => void;
  onDelete: () => void;
  isEditable: boolean;
  fieldGroups?: FieldGroup[];
  allFields?: Record<string, CollectionField[]>;
  collections?: Collection[];
  isInsideCollectionLayer?: boolean;
}

export default function RichTextComponentBlock({
  componentId,
  componentOverrides,
  onOverridesChange,
  onDelete,
  isEditable,
  fieldGroups,
  allFields,
  collections,
  isInsideCollectionLayer,
}: RichTextComponentBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const getComponentById = useComponentsStore(state => state.getComponentById);
  const components = useComponentsStore(state => state.components);
  const editingComponentId = useEditorStore(state => state.editingComponentId);
  const component = getComponentById(componentId);
  const variables = useMemo(() => component?.variables ?? [], [component?.variables]);
  const hasVariables = variables.length > 0;

  // Detect infinite loops when this component would reference the component being edited
  const isCircular = useMemo(() => {
    if (!editingComponentId || !componentId) return false;
    return isCircularComponentReference(editingComponentId, componentId, components);
  }, [editingComponentId, componentId, components]);

  if (isCircular) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-orange-400/40 bg-orange-500/5 px-3 py-2 text-xs text-orange-600 dark:text-orange-300">
        <Icon name="component" className="size-3.5 shrink-0" />
        <span>Circular reference — {component?.name ?? 'component'} cannot embed itself</span>
        {isEditable && (
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto size-5! p-0!"
            onClick={onDelete}
          >
            <Icon name="x" className="size-3" />
          </Button>
        )}
      </div>
    );
  }

  if (!component) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <Icon name="component" className="size-3.5 shrink-0" />
        <span>Component not found</span>
        {isEditable && (
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto size-5! p-0!"
            onClick={onDelete}
          >
            <Icon name="x" className="size-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background text-xs select-none">
      {/* Header */}
      <div
        role={hasVariables ? 'button' : undefined}
        tabIndex={hasVariables ? 0 : undefined}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-4 text-left',
          hasVariables && 'cursor-pointer',
        )}
        onClick={() => hasVariables && setIsExpanded(prev => !prev)}
        onKeyDown={(e) => {
          if (hasVariables && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded(prev => !prev);
          }
        }}
      >
        <Icon name="component" className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-medium">{component.name}</span>

        {hasVariables && (
          <Icon
            name="chevronRight"
            className={cn('size-3 text-muted-foreground transition-transform', isExpanded && 'rotate-90')}
          />
        )}

        {isEditable && (
          <Button
            size="xs"
            variant="ghost"
            className="size-5! p-0! shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Icon name="x" className="size-3" />
          </Button>
        )}
      </div>

      {/* Collapsible override controls */}
      {isExpanded && hasVariables && (
        <div className="border-t border-border px-3 py-3">
          <ComponentVariableOverrides
            variables={variables}
            componentOverrides={componentOverrides}
            onOverridesChange={onOverridesChange}
            fieldGroups={fieldGroups}
            allFields={allFields}
            collections={collections}
            isInsideCollectionLayer={isInsideCollectionLayer}
            renderTextOverride={(variable, value, onChange) => (
              <InlineTextOverride value={value} onChange={onChange} />
            )}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simple text input for overriding text variables inline.
 * Uses local state while typing and commits on blur to avoid
 * triggering Tiptap transactions on every keystroke.
 */
function InlineTextOverride({
  value,
  onChange,
}: {
  value: any;
  onChange: (val: any) => void;
}) {
  const externalText = useMemo(() => {
    const doc = value as any;
    if (doc?.type !== 'doc' || !doc.content) return '';
    return doc.content
      .map((block: any) =>
        block.content?.map((n: any) => n.text ?? '').join('') ?? '',
      )
      .join('\n');
  }, [value]);

  const [localText, setLocalText] = useState(externalText);
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setLocalText(externalText);
    }
  }, [externalText, isFocused]);

  const commit = useCallback((text: string) => {
    onChange({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: text ? [{ type: 'text', text }] : [],
        },
      ],
    });
  }, [onChange]);

  return (
    <Input
      value={localText}
      onChange={(e) => setLocalText(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        commit(localText);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit(localText);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className="text-xs"
      placeholder="Enter value..."
    />
  );
}
