import React from "react";

import Frontend from './frontend.jsx';
import API from './tapir.js';

import { Form, Input, Button } from 'antd';

var api = null;

export function TapirAPI()
{
  return api
}

function LoginForm(props)
{
  let message = "Please input API key !";
  if (props.error)
    message = "Bad API key !";

  return (
    <Form
      ref={props.formRef}
      name="basic"
      requiredMark={false}
      labelCol={{
        span: 8,
      }}
      wrapperCol={{
        span: 16,
      }}
      initialValues={{
        remember: true,
      }}
      onFinish={props.onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Enter API Key"
        name="password"
        validateStatus="error"
        rules={[ { required : true, message : message}]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        wrapperCol={{
          offset: 8,
          span: 16,
        }}
      >
        <Button type="primary" htmlType="submit">
          Login 
        </Button>
      </Form.Item>
    </Form>
  );
}

export default class Login extends React.Component
{
  formRef = React.createRef();

  constructor(props)
  {
    super(props);
    this.state = { showLogin : true, error : false };
  }

  onFinish(form)
  {
    api = new API(form.password);

    api.root().then(_ => 
    {
      this.setState({showLogin : false });
    })
    .catch(error => 
    {
      if (error.response.status === 401)
      {
        this.formRef.current.setFieldsValue({'password' : null});
        this.formRef.current.validateFields();
        this.setState({error : true}); //show a bad log in or password
      }
    });
  };

  render()
  {
    if(this.state.showLogin)
    {
      return(
      <div style={{left : '50%', top : '30%', position : 'absolute', transform: "translate(-50%, -50%)"}} >
        <h1 style={{color : 'white' }}>Welcome to Tapir</h1>
          <LoginForm formRef={this.formRef} onFinish={this.onFinish.bind(this)} error={this.state.error}/>
      </div>)
    }
    return (<Frontend />)
  }
}
