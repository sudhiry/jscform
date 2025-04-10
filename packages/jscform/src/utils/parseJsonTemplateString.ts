import JSONPointer from "jsonpointer";

export function parseJsonTemplateString(message: string, obj: Record<string, any>) {
    if(!message) return message;
    const regex = /\${(.*?)}/g;
    return message.replace(regex, (match, p1) => {
      const value = JSONPointer.get(obj, p1);
      return value !== undefined ? value : match;
    });
}