import React, {memo, ReactElement, useMemo} from "react";
import {PROPERTIES_KEY, UI_WIDGET} from "../utils/constants";
import {globalRegistry} from "../createRegistry";
import {useSchema} from "../hooks/useSchema";
import {useComputed} from "../signals/react-signals";

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
    }, [schema, schemaKey]);

    // Use computed for child component keys to optimize re-renders
    const childKeys = useComputed(() => {
        if (!schema || !schema[PROPERTIES_KEY]) return [];
        return Object.keys(schema[PROPERTIES_KEY]).map(property => 
            `${schemaKey ? schemaKey + "." : ""}${property}`
        );
    }, [schema, schemaKey]);

    if (!widgetInfo) {
        return null;
    }

    const { uiWidget, Widget, hasProperties } = widgetInfo;

    if (!hasProperties) {
        return <Widget {...schema} {...uiWidget} name={schemaKey}></Widget>
    }

    const ContainerComponent = Widget || React.Fragment;
    
    // Memoize child components to prevent unnecessary re-renders
    const childComponents = useMemo(() => {
        return childKeys.map(childKey => (
            <DynamicUIComponent
                schemaKey={childKey}
                key={childKey}
                {...uiWidget}
            />
        ));
    }, [childKeys, uiWidget]);

    return <ContainerComponent>{childComponents}</ContainerComponent>;
});

DynamicUIComponent.displayName = 'DynamicUIComponent';
