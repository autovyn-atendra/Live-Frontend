import React from 'react';
import Link from 'next/link'
 
export interface LinkProps {
    href:string
    text:string
    className?:string
  }
  
  export function LinkA({href,text,className}: LinkProps) {
    return (
      <div>
        <Link className={className} style={{color:"blue"}} href={href}>{text}</Link>
      </div>
    );
  }
  
  export default LinkA;
  
   