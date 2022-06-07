import React from "react";

import { Modal, Transfer } from 'antd';

function ColumnsSelection(props)
{
  return (
     <Modal title="Columns selection" visible={props.visible} onOk={props.onOk} onCancel={props.onCancel}>
       <Transfer
         dataSource={props.dataSource} 
         titles={['Not visible', 'Visible']}
         targetKeys={props.targetKeys} 
         onChange={props.onChange} 
         render={ item => item.title }
         rowKey={record => record.title }
        />
      </Modal>)
}

export default ColumnsSelection;
