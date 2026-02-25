'use client';

/**
 * Shared component for rendering component variable override controls.
 * Used in both the RightSidebar (component instance panel) and
 * RichTextComponentBlock (inline rich-text component).
 */

import React, { useMemo, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import ImageSettings from './ImageSettings';
import LinkSettings from './LinkSettings';
import AudioSettings from './AudioSettings';
import VideoSettings from './VideoSettings';
import IconSettings from './IconSettings';
import {
  extractTiptapFromComponentVariable,
  createTextComponentVariableValue,
} from '@/lib/variable-utils';
import type {
  ComponentVariable,
  ImageSettingsValue,
  LinkSettingsValue,
  AudioSettingsValue,
  VideoSettingsValue,
  IconSettingsValue,
  Layer,
  CollectionField,
  Collection,
} from '@/types';
import type { FieldGroup } from '@/lib/collection-field-utils';

type Overrides = Layer['componentOverrides'];

interface ComponentVariableOverridesProps {
  variables: ComponentVariable[];
  componentOverrides: Overrides;
  onOverridesChange: (overrides: Overrides) => void;
  fieldGroups?: FieldGroup[];
  allFields?: Record<string, CollectionField[]>;
  collections?: Collection[];
  isInsideCollectionLayer?: boolean;
  /** Custom renderer for text variable overrides (avoids circular dependency with RichTextEditor). */
  renderTextOverride?: (
    variable: ComponentVariable,
    value: any,
    onChange: (tiptapContent: any) => void,
  ) => React.ReactNode;
}

function groupVariables(variables: ComponentVariable[]) {
  return {
    text: variables.filter(v => !v.type || v.type === 'text'),
    image: variables.filter(v => v.type === 'image'),
    link: variables.filter(v => v.type === 'link'),
    audio: variables.filter(v => v.type === 'audio'),
    video: variables.filter(v => v.type === 'video'),
    icon: variables.filter(v => v.type === 'icon'),
  };
}

export default function ComponentVariableOverrides({
  variables,
  componentOverrides,
  onOverridesChange,
  fieldGroups,
  allFields,
  collections,
  isInsideCollectionLayer,
  renderTextOverride,
}: ComponentVariableOverridesProps) {
  const groups = useMemo(() => groupVariables(variables), [variables]);

  const handleTextChange = useCallback(
    (variableId: string, tiptapContent: any) => {
      const value = createTextComponentVariableValue(tiptapContent);
      onOverridesChange({
        ...componentOverrides,
        text: { ...(componentOverrides?.text ?? {}), [variableId]: value },
      });
    },
    [componentOverrides, onOverridesChange],
  );

  const handleTypedChange = useCallback(
    (category: keyof NonNullable<Overrides>, variableId: string, value: any) => {
      onOverridesChange({
        ...componentOverrides,
        [category]: { ...(componentOverrides?.[category] ?? {}), [variableId]: value },
      });
    },
    [componentOverrides, onOverridesChange],
  );

  const getTextValue = useCallback(
    (variableId: string) => {
      const override = componentOverrides?.text?.[variableId];
      const def = variables.find(v => v.id === variableId)?.default_value;
      return extractTiptapFromComponentVariable(override ?? def);
    },
    [componentOverrides, variables],
  );

  const getTypedValue = useCallback(
    (category: 'image' | 'link' | 'audio' | 'video' | 'icon', variableId: string) => {
      const override = componentOverrides?.[category]?.[variableId];
      const def = variables.find(v => v.id === variableId)?.default_value;
      return override ?? def;
    },
    [componentOverrides, variables],
  );

  if (variables.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {groups.text.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.text.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2 min-w-0 *:w-full">
                {renderTextOverride
                  ? renderTextOverride(
                    variable,
                    getTextValue(variable.id),
                    (val) => handleTextChange(variable.id, val),
                  )
                  : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.image.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.image.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2">
                <ImageSettings
                  mode="standalone"
                  value={getTypedValue('image', variable.id) as ImageSettingsValue | undefined}
                  onChange={(val) => handleTypedChange('image', variable.id, val)}
                  fieldGroups={fieldGroups}
                  allFields={allFields}
                  collections={collections}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.link.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.link.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2">
                <LinkSettings
                  mode="standalone"
                  value={getTypedValue('link', variable.id) as LinkSettingsValue | undefined}
                  onChange={(val) => handleTypedChange('link', variable.id, val)}
                  fieldGroups={fieldGroups}
                  allFields={allFields}
                  collections={collections}
                  isInsideCollectionLayer={isInsideCollectionLayer}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.audio.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.audio.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2">
                <AudioSettings
                  mode="standalone"
                  value={getTypedValue('audio', variable.id) as AudioSettingsValue | undefined}
                  onChange={(val) => handleTypedChange('audio', variable.id, val)}
                  fieldGroups={fieldGroups}
                  allFields={allFields}
                  collections={collections}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.video.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.video.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2">
                <VideoSettings
                  mode="standalone"
                  value={getTypedValue('video', variable.id) as VideoSettingsValue | undefined}
                  onChange={(val) => handleTypedChange('video', variable.id, val)}
                  fieldGroups={fieldGroups}
                  allFields={allFields}
                  collections={collections}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {groups.icon.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.icon.map(variable => (
            <div key={variable.id} className="grid grid-cols-3 gap-2 items-start">
              <Label variant="muted" className="truncate pt-2">
                {variable.name}
              </Label>
              <div className="col-span-2">
                <IconSettings
                  mode="standalone"
                  value={getTypedValue('icon', variable.id) as IconSettingsValue | undefined}
                  onChange={(val) => handleTypedChange('icon', variable.id, val)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
