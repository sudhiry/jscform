import React, { memo, ReactElement } from "react";
import { PROPERTIES_KEY, UI_WIDGET } from "../utils/constants";
import { globalRegistry } from "../createRegistry";
import { useSchema } from "../hooks/useSchema";
import {useSignals} from "@preact/signals-react/runtime";

interface DynamicUIComponentProps {
    schemaKey?: string;
    children?: ReactElement;
}

export const DynamicUIComponent = memo(({ schemaKey = "" }: DynamicUIComponentProps) => {
    useSignals()
    const schemaSignal = useSchema(schemaKey);
    const schema = schemaSignal.value;

    if (!schema) {
        return null;
    }

    if (!schema[UI_WIDGET]) {
        throw new Error(`${UI_WIDGET} property missing for "${schemaKey}"`);
    }

    const uiWidget = schema[UI_WIDGET];
    const Widget = globalRegistry[uiWidget.widget];
    const hasProperties = !!schema[PROPERTIES_KEY];

    if (!hasProperties && !Widget) {
        throw new Error(`Widget "${uiWidget.widget}" not found in registry`);
    }

    if (!hasProperties) {
        return <Widget {...schema} {...uiWidget} name={schemaKey} />;
    }

    const childKeys = Object.keys(schema[PROPERTIES_KEY] || {}).map(property =>
        `${schemaKey ? `${schemaKey}.` : ""}${property}`
    );

    const ContainerComponent = Widget || React.Fragment;

    const childComponents = childKeys.map((childKey: string) => (
        <DynamicUIComponent
            schemaKey={childKey}
            key={childKey}
            {...uiWidget}
        />
    ));

    return <ContainerComponent>{childComponents}</ContainerComponent>;
});

DynamicUIComponent.displayName = 'DynamicUIComponent';
