async function clipboardCopy(text) 
{
  if (navigator.clipboard && window.isSecureContext) 
  {
    return navigator.clipboard.writeText(text);
  } 
  else 
  {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    // make the textarea out of viewport
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    return new Promise((res, rej) => 
    {
      document.execCommand('copy') ? res() : rej();
      textArea.remove();
    });
  }
}

export default clipboardCopy;
