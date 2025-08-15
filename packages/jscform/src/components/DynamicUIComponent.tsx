import React, {memo, ReactElement, useMemo} from "react";
import { useComputed } from "@preact/signals-react";
import {PROPERTIES_KEY, UI_WIDGET} from "../utils/constants";
import {globalRegistry} from "../createRegistry";
import {useSchema} from "../hooks/useSchema";

interface DynamicUIComponentProps {
    schemaKey?: string;
    children?: ReactElement;
}

export const DynamicUIComponent = memo(({schemaKey = ""}: DynamicUIComponentProps) => {
    const schema = useSchema(schemaKey);

    // Use computed to optimize widget resolution
    const widgetInfo = useComputed(() => {
        if (!schema) return null;

        if (!schema[UI_WIDGET]) {
            throw Error(`${UI_WIDGET} property missing for "${schemaKey}"`);
        }

        const uiWidget = schema[UI_WIDGET];
        const Widget = globalRegistry[uiWidget.widget];

        if (!schema[PROPERTIES_KEY] && !Widget) {
            throw Error(`Widget "${uiWidget.widget}" not found in registry`);
        }

        return {
            uiWidget,
            Widget,
            hasProperties: !!schema[PROPERTIES_KEY]
        };
    });

    // Use computed for child component keys to optimize re-renders
    const childKeys = useComputed(() => {
        if (!schema || !schema[PROPERTIES_KEY]) return [];
        return Object.keys(schema[PROPERTIES_KEY]).map(property =>
            `${schemaKey ? schemaKey + "." : ""}${property}`
        );
    });

    if (!widgetInfo.value) {
        return null;
    }

    const { uiWidget, Widget, hasProperties } = widgetInfo.value;

    if (!hasProperties) {
        return <Widget {...schema} {...uiWidget} name={schemaKey}></Widget>
    }

    const ContainerComponent = Widget || React.Fragment;

    // Memoize child components to prevent unnecessary re-renders
    const childComponents = useMemo(() => {
        return childKeys.value.map((childKey: string) => (
            <DynamicUIComponent
                schemaKey={childKey}
                key={childKey}
                {...uiWidget}
            />
        ));
    }, [childKeys.value, uiWidget]);

    return <ContainerComponent>{childComponents}</ContainerComponent>;
});

DynamicUIComponent.displayName = 'DynamicUIComponent';
