import React from "react";

import { Modal, Form, Input } from 'antd';

class AddAttributeForm extends React.Component
{
  formRef = React.createRef();

  sendFormData(form)
  {
    this.props.onOk({name : form.name, value : form.value});
  }

  render()
  {
    return (
      <Form ref={this.formRef} id={this.props.formName} labelCol={{ span: 8, }}
        wrapperCol={{span: 16,}} initialValues={{ remember: false, }}
        onFinish={this.sendFormData.bind(this)}
        autoComplete="off"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{required: true, message: 'Attribute name',},]}
        >
          <Input placeholder="name" /> 
        </Form.Item>
        <Form.Item
          label="Value"
          name="value"
          rules={[{required: true, message: 'Attribute value',},]}
        >
          <Input placeholder="value" /> 
        </Form.Item>
      </Form>
    );
  }
}

export default function AddAttribute(props)
{
  let formName = "AddAttribute" + props.browser_id;

  return (
      <Modal title="Add attribute" visible={props.visible} okButtonProps={{form: formName, key: 'submit', htmlType: 'submit'}} onCancel={props.onCancel}>
      <AddAttributeForm onOk={props.onOk} exportType={props.exportType} formName={formName}  />
    </Modal>)
}
