import { Image } from 'antd';

function ImageViewer(props)
{
  return (
    <Image height="100%" src={props.fileUrl} />
  );
}

export default ImageViewer;
