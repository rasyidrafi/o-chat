import React from 'react';

const HorizontalRule: React.FC = (props) => (
  <div className="my-4" {...props}>
    <div className="w-full h-px relative border-t border-zinc-200 dark:border-zinc-700/80">
    </div>
  </div>
);

export default HorizontalRule;
