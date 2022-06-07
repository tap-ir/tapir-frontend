import eventBus from '../utils/eventbus.js';
import { TapirAPI } from '../login.js';

import React, { useState } from 'react';
import { Tree } from 'antd';

const initTreeData = [
  {
    title: 'root',
    key: 1,
  },
]; 

function updateTreeData(list, key, children) 
{
  return list.map((node) => 
  {
    if (node.key === key) 
    {
      return { ...node, children };
    }

    if (node.children) 
    {
      return { ...node, children: updateTreeData(node.children, key, children) };
    }

    return node;
  });
}

const NodeTree = (props) => 
{
  const [treeData, setTreeData] = useState(initTreeData);
  const api = TapirAPI();

  function selected(selectedKeys, e)
  {
    eventBus.dispatch("changedir" + props.browser_id, {index1: e.node.key, stamp : 0});
  }

  const onLoadData = ({ key, children }) =>
    new Promise((resolve) => 
    {
      if (children) 
      {
        resolve();
        return;
      }

      api.node_by_id({index1 : key, stamp : 0}, true, false, false, true).then(response =>
      {
        let node_children = response.data.children;
        let children_list = [];
        for (const child of node_children)
        {
          if (child.has_children === true) 
          {
            children_list.push({title: child.name, key : child.id.index1});
          }
        }
        setTreeData((origin) =>
          updateTreeData(origin, key, children_list),
        );
        resolve();
      });
    });

  return (
      <Tree 
         loadData={onLoadData} 
         treeData={treeData} 
         onSelect={selected}
      />
  );
};

export default NodeTree;
