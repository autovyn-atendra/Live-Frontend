import Image from 'next/image'
/* eslint-disable-next-line */
export interface ImageProps {
    src:string 
    className?:string
    onClick?:()=> void;
    alt:string
    width?:number
    height?:number
    onMouseEnter?:()=> void;
    onMouseLeave?:()=> void;

}

export function ImageA({src,className,onClick,alt,height,width,onMouseEnter,onMouseLeave}: ImageProps) {
  return (
    <Image
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className={className}
    src={src}
    height={height?height:"300"}
    width={width?width:"300"} 
    alt={alt}
    onClick={onClick}
  />
    );
}

export default ImageA;
