import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const formTypes = [
  { 
    name: "Basic Form", 
    path: "/forms/basic-form", 
    description: "A simple form demonstrating basic input fields, validation, and conditional logic",
    status: "✅ Available"
  },
  { 
    name: "Complex Form", 
    path: "/forms/complex-form", 
    description: "Advanced form with nested objects, conditional fields, and custom validation messages",
    status: "✅ Available"
  },
  { 
    name: "UI Library Examples", 
    path: "/forms/ui-examples", 
    description: "Integration examples with different UI libraries (Material-UI, Ant Design, etc.)",
    status: "🚧 Coming Soon"
  },
  { 
    name: "Multi-step Form", 
    path: "/forms/multi-step-form", 
    description: "A wizard-style form split into multiple steps with progress tracking",
    status: "🚧 Coming Soon"
  },
  { 
    name: "Array Fields", 
    path: "/forms/array-form", 
    description: "Dynamic arrays with add/remove functionality and nested validation",
    status: "🚧 Coming Soon"
  },
  { 
    name: "Custom Components", 
    path: "/forms/custom-components", 
    description: "Examples of building and registering custom form components",
    status: "🚧 Coming Soon"
  },
]

export default function FormsMenu() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Form Examples</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {formTypes.map((form) => (
          <Card key={form.path} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{form.name}</CardTitle>
                <span className="text-sm px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  {form.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                {form.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              {form.status.includes('Available') ? (
                <Link
                  href={form.path}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors"
                >
                  View Example
                </Link>
              ) : (
                <div className="w-full bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-md text-center cursor-not-allowed">
                  Coming Soon
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
