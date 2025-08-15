"use client"
import {Form, JSONSchema, createRegistry, ajv} from "@repo/jscform";
import complexSchema from "./complex-schema.json";
import {Input} from "@/components/ui/input.tsx";
import {Col1Layout} from "@/components/ui/col1Layout.tsx";
import {Col2Layout} from "@/components/ui/col2Layout.tsx";
import {Col3Layout} from "@/components/ui/col3Layout.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import {Button} from "@/components/ui/button.tsx";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {useState} from "react";

// Register components for complex form
createRegistry({
    Input,
    Checkbox,
    Col1Layout,
    Col2Layout,
    Col3Layout,
    Button,
    Section: ({ schema, children }: { schema: any; children: React.ReactNode }) => (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{schema?.title}</CardTitle>
                {schema?.description && (
                    <CardDescription>{schema.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
        </Card>
    ),
});

export default function ComplexForm() {
    const [formData, setFormData] = useState<any>({
        personalInfo: {
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com"
        },
        hasEmployment: true,
        preferences: {
            newsletter: true,
            notifications: false
        }
    });

    const onSubmit = (data: Record<string, any>) => {
        console.log("Complex form submitted:", data);
        alert("Form submitted! Check console for data.");
        // Update form data to show the submitted values
        setFormData(data);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Complex Form Example</h1>
                <p className="text-gray-600">
                    This example demonstrates advanced features including nested objects, 
                    conditional fields, arrays, and custom validation messages.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Form 
                        validator={ajv} 
                        schema={complexSchema as JSONSchema} 
                        onSubmit={onSubmit}
                        data={formData}
                    />
                </div>
                
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Data</CardTitle>
                            <CardDescription>
                                Real-time form state (updates as you type)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                                {JSON.stringify(formData, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
