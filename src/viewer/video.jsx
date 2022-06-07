import ReactPlayer from 'react-player';

function VideoViewer(props)
{
  return (
      <ReactPlayer
        className='react-player'
        url={props.fileUrl}
        width='100%'
        height='100%'
        muted={true}
        controls={true}
      />);
}

export default VideoViewer;
