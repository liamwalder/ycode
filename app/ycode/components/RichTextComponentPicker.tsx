'use client';

/**
 * Right-side sheet panel for selecting a component to insert into rich-text.
 * Mirrors the sidebar pattern from the legacy project.
 */

import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Empty, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { useComponentsStore } from '@/stores/useComponentsStore';
import { useEditorStore } from '@/stores/useEditorStore';
import { isCircularComponentReference } from '@/lib/component-utils';
import ComponentCard from './ComponentCard';

interface RichTextComponentPickerProps {
  onSelect: (componentId: string) => void;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RichTextComponentPicker({
  onSelect,
  disabled = false,
  open,
  onOpenChange,
}: RichTextComponentPickerProps) {
  const components = useComponentsStore(state => state.components);
  const editingComponentId = useEditorStore(state => state.editingComponentId);
  const [search, setSearch] = useState('');

  const filteredComponents = useMemo(() => {
    let list = components;

    // When editing a component, exclude components that would create a circular reference
    if (editingComponentId) {
      list = list.filter(c =>
        !isCircularComponentReference(editingComponentId, c.id, components)
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(query));
    }

    return list;
  }, [components, editingComponentId, search]);

  const handleSelect = (componentId: string) => {
    onOpenChange(false);
    setSearch('');
    // Defer insertion so the Sheet fully unmounts before the editor regains focus
    requestAnimationFrame(() => {
      onSelect(componentId);
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setSearch('');
        onOpenChange(v);
      }}
    >
      <SheetContent
        side="right"
        className="w-64 max-w-64 p-4"
        aria-describedby={undefined}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <SheetTitle>Insert Component</SheetTitle>
        </VisuallyHidden>

        <div className="flex items-center border-b border-border -mx-4 -mt-4 px-4 h-14 shrink-0 bg-background sticky -top-4 z-10">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search components..."
              className="h-8 text-xs pl-9"
              autoFocus
            />
          </div>
        </div>

        {filteredComponents.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <Icon name="component" className="size-4" />
            </EmptyMedia>
            <EmptyTitle>
              {search.trim() ? 'No matching components' : 'No components available'}
            </EmptyTitle>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {filteredComponents.map(component => (
              <ComponentCard
                key={component.id}
                component={component}
                onClick={() => handleSelect(component.id)}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
