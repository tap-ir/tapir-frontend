import axios from 'axios';
import http from 'http';
import https from 'https';

/*const httpAgent = new https.Agent({ 
    keepAlive: true,
    rejectUnauthorized: false,
    });
*/

//maxContentLength: `Infinity`,

export default class TapirAPI
{
  constructor(key) 
  {
    let httpAgent = new http.Agent({ 
      keepAlive: true,
      //maxSocket : 1,
      //keepAliveMsecs: 100000,
      });
    this.session = axios.create({ ...httpAgent, headers: { 'x-api-key' : key } });
    this.api_key = key;
    this.url_base = "http://" + window.location.hostname + ":3583/api";
  }

  async plugins() 
  {
    let res = await this.session.get(this.url_base + '/plugins', );
    return res;
  }

  download_url_from_id(node_id)
  {
    if (!node_id.stamp)
    {
      return (this.url_base + "/download_id?apikey=" + this.api_key  +"&node_id.index1=" + node_id.index1 + "&node_id.stamp=0");
    }
    else
    {
      return (this.url_base + "/download_id?apikey=" + this.api_key  + "&node_id.index1=" + node_id.index1 + "&node_id.stamp=" + node_id.stamp);
    }
  }

  async download(node_id)
  {
    let res = await this.session.post(this.url_base + '/download', node_id, { responseType: 'blob' });
    return res;
  }

  async read(node_id, size, offset)
  {
    let res = await this.session.post(this.url_base + '/read', { node_id : node_id, offset : offset, size : size}, { responseType : 'blob' });
    return res;
  }

  async root() 
  {
    return this.node_by_path("/root");
  }

  async node_path(node_id)
  {
    let res = await this.session.post(this.url_base + "/path", node_id)
    return res;
  }

  async node_by_path(path) 
  {
    let res = await this.session.get(this.url_base + path);
    return res
  }

  async node_by_id(id, name = true, path = false, attributes = true, children = true)
  {
    let opt = {"name" : name,
               "path" : path,
               "attributes" : attributes ,
               "children" : children, };
    let res = await this.session.post(this.url_base + "/node", {node_id : id, option : opt });
    return res;
  }

  async nodes_by_id(ids, name = true, path = false, attributes = true, children = false)
  {
    let opt = {"name" : name,
               "path" : path,
               "attributes" : attributes ,
               "children" : children, };
    let res = await this.session.post(this.url_base + "/nodes", {nodes_id : ids, option : opt });
    return res;
  }

  async nodes_by_id_as_blob(ids, name = true, path = false, attributes = true, children = false)
  {
    let opt = {"name" : name,
               "path" : path,
               "attributes" : attributes ,
               "children" : children, };
    let res = await this.session.post(this.url_base + "/nodes", {nodes_id : ids, option : opt }, { responseType : 'blob' });
    return res;
  }

  async parent_id_by_path(path)
  {
    let response = await this.node_by_path(path);
    return await this.parent_id(response.data.id);
  }

  async parent_id(node_id)
  {
    return await this.session.post(this.url_base + "/parent_id", node_id)
  }

  async children_by_path(parent_path) 
  {
    let node = await this.node_by_path(parent_path).catch(function (error)
    {
      return null;
    });

    if (node && node.data.children.length)
    {
      return await [node.data.id, this.children(node.data.children)];
    }
    return null;
  }

  async children_by_id(node_id)
  {
    let parent_node = await this.node_by_id(node_id, false, false, false, true);
    if (parent_node.data.children.length)
      return await this.children(parent_node.data.children);
    return null;
  }

  async children(children)
  {
    let child_ids = [];
    
    for (var i = 0; i < children.length; i++)
    {
      child_ids.push(children[i].id);
    }
    let nodes = await this.nodes_by_id(child_ids); 
    return nodes;
  }

  async add_attribute(node_id, name, value, description = null)
  {
    if (description != null)
      return await this.session.post(this.url_base + "/attribute", {node_id : node_id, name : name, value : value });
    else
      return await this.session.post(this.url_base + "/attribute", {node_id : node_id, name : name, value : value, description : description });
  }

  async timeline(after, before, name = false, path = false, attributes = false, children = false)
  {
    /*let reqObj = {
      method: "POST",
      url: this.url_base + "/timeline",
      data: {'after' : after, 'before' : before },
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      maxContentLength: 10000000000000000,
      maxBodyLength: 100000000000000,
      };
    let res = await axios(reqObj);*/
    let opt = {name : name,
               path : path,
               attributes : attributes ,
               children : children };
    let res = await this.session.post(this.url_base + "/timeline", {after : after, before : before, option : opt });
    return res;
  }

  async query(root, query)
  {
    let res = await this.session.post(this.url_base + "/query", { "query" : query, "root" : root});
    return res;
  }

  async task_count() 
  {
    let res = await this.session.post(this.url_base + "/task_count")
    return res;
  }

  async task(id)
  {
    let params = "?task_id=" + id;
    let res = await this.session.post(this.url_base + "/task" + params);
    return res
  }

  async tasks(ids)
  {
    let res = await this.session.post(this.url_base + "/tasks", {ids : ids, format : "string"});
    return res;
  }

  async schedule(name, args, relaunch = false)
  {
    let res = await this.session.post(this.url_base + "/schedule", {'name' : name, arguments : JSON.stringify(args), relaunch : relaunch});
    return res;
  }
}
