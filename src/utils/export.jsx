import { TapirAPI } from "../login.js";
import { notifyError } from "../utils/notification";

import { message } from "antd";

import * as zip from "@zip.js/zip.js";

const MAX_ZIP_SIZE = 300*1024*1024;

export async function exportToZip(args, records)
{
  let api = TapirAPI();
  let nodes_id  = [];
  let total_size = 0;

  for (const record of records)
  {
    let attributes = record.attributes;

    if (attributes == null)
    {
       let node = await api.node_by_id(record.id, false, false, true, false); 
       attributes = node.data.attributes;
    }

    if (attributes.data && attributes.data.size)
    {
       nodes_id.push({id : record.id, name : record.name});
       total_size += attributes.data.size;
    }
  }

  const closeMessage = message.loading('Creating file : ' + args.config.filename,  0);
  if (nodes_id.length > 0 && total_size < MAX_ZIP_SIZE)
  {
    await downloadToZip(nodes_id, args.config.filename, args.config.password);
  }
  else if (total_size > MAX_ZIP_SIZE)
  {
    notifyError('Download zip error', 'Total files size is too big : ' + total_size + ' bytes');
  }
  closeMessage();
}

//XXX set compression to 0, goal is just to download multiple files ?
export async function downloadToZip(files, fileName, password)
{
  let api = TapirAPI();
  const blobWriter = new zip.BlobWriter("application/zip");
  const writer = new zip.ZipWriter(blobWriter, {password : password});

  for (const file of files)
  {
    try
    {
      //await after the for so file are added in // if possible ?
      await writer.add(file.name, new zip.HttpReader(api.download_url_from_id(file.id), {preventHeadRequest : true}));
    }
    catch (e) //XXX if e "File already exists"
    {
      //console.log(e)
      //if same file name it will fail ! we retry with name + id as it's unique // must still catch other error
      //XXX check type of e error
      await writer.add(file.name + file.id.index1, new zip.HttpReader(api.download_url_from_id(file.id), {preventHeadRequest : true}));
    }
  }

  await writer.close();

  const blob = blobWriter.getData();
  downloadBlob(blob, fileName);
}

export function downloadBlob(data, fileName)
{
  //let blob = new Blob([data], {type: contentType});
  let link = document.createElement('a');
  link.href = window.URL.createObjectURL(data);
  link.download = fileName;
  link.click();
}

export function exportToJson(nodes_id, fileName)
{
  let api = TapirAPI();
  
  const closeMessage = message.loading('Creating file : ' + fileName,  0);
  api.nodes_by_id_as_blob(nodes_id, true, true, true, false).then(response => 
  {
    downloadBlob(response.data, fileName);
    closeMessage();
  });
}
