import { TapirAPI } from "./../login.js";

export var PLUGINS_CONFIG = null; 

export function createPluginsConfig()
{
  PLUGINS_CONFIG = (async () => 
  {
    const plugins_config = await pluginsConfig();
    return plugins_config
  })();
}

async function pluginsConfig()
{
  let api = TapirAPI();
  let response = await api.plugins();
  return parsePluginsConfig(response.data);
}

function parsePluginsConfig(plugins)
{
  let pluginsConfig = {};
  for (const plugin of plugins)
  {
    let args = {}; 
    let schema = plugin.config;
    for (const argument_name in schema.properties)
    {
      let properties = schema.properties[argument_name];
      let type = null;
      let subtype = null;

      if (properties.type === "array")
      {
        type = properties.type;
        subtype = getType(properties.items);
      }
      else 
      {
        type = getType(properties);
        if (type === "VecTreeNodeId")
        {
          type = "array";
          subtype = "NodeId";
        }
      }
      let required = false;
      if (schema.required.find((required_arg) => required_arg === argument_name))
        required = true;

      args[argument_name] = { type : type, subtype : subtype, required : required };
    }
    pluginsConfig[plugin.name] = { arguments : args, category : plugin.category, description : plugin.description };
  }
  return pluginsConfig;
}

function getType(properties)
{
  if (properties.type)
  {
    return properties.type;
  }
  if (properties["$ref"] === "#/definitions/TreeNodeId")
  {
    return "NodeId";
  }
  else if (properties["$ref"] === "#/definitions/AttributePath")
  {
    return "AttributePath";
  }
  else if (properties["$ref"] === "#/definitions/VecTreeNodeId")
  {
    return "VecTreeNodeId";
  }
  else if (properties.allOf)
  {
    return getType(properties.allOf[0]);
  }

  return null;
}
