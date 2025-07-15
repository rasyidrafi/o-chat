import React from 'react';

const HorizontalRule: React.FC = (props) => (
  <div className="my-4" {...props}>
    <div className="w-full h-px relative">
      <div className="absolute inset-0 dark:hidden" 
           style={{
             background: 'linear-gradient(to right, transparent 0%, rgb(161 161 170) 15%, rgb(161 161 170) 90%, transparent 100%)',
           }}
      />
      <div className="absolute inset-0 dark:block hidden" 
           style={{
             background: 'linear-gradient(to right, transparent 0%, rgb(82 82 91) 15%, rgb(82 82 91) 90%, transparent 100%)',
           }} />
    </div>
  </div>
);

export default HorizontalRule;
