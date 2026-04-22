declare module 'react-quill-new' {
  import React from 'react';
  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    placeholder?: string;
    modules?: any;
    formats?: string[];
  }
  const ReactQuill: React.FC<ReactQuillProps>;
  export default ReactQuill;
}
