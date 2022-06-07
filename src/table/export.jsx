import React from "react";

import { Button, Menu, Dropdown, Modal, Form, Input } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExport, faFileCsv, faFileCode, faFileArchive } from '@fortawesome/free-solid-svg-icons'

const { SubMenu } = Menu;

export function ExportMenu(props)
{
  const menu = ( 
    <Menu onClick={props.onClick}>
      <SubMenu key="Selection" title="Selection">
        <Menu.Item key="SelectionCsv"><FontAwesomeIcon icon={faFileCsv} />  CSV</Menu.Item>
        <Menu.Item key="SelectionJson"><FontAwesomeIcon icon={faFileCode} />  JSON</Menu.Item>
        <Menu.Item key="SelectionZip"><FontAwesomeIcon icon={faFileArchive} />  Zip</Menu.Item>
      </SubMenu>
      <SubMenu key="All" title="All">
        <Menu.Item key="AllCsv"><FontAwesomeIcon icon={faFileCsv} />  CSV</Menu.Item>
        <Menu.Item key="AllJson"><FontAwesomeIcon icon={faFileCode} />  JSON</Menu.Item>
        <Menu.Item key="AllZip"><FontAwesomeIcon icon={faFileArchive} />  Zip</Menu.Item>
      </SubMenu>
    </Menu>
  ); 

  return (
    <Dropdown overlay={menu}>
      <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
        <Button title="Export selection" icon={<FontAwesomeIcon icon={faFileExport} />} />
      </a>
    </Dropdown>
  );
}

class ExportConfigForm extends React.Component
{
  formRef = React.createRef();

  constructor(props)
  {
    super(props);
    this.state = { password : false, extension : "." };
  }

  componentDidMount()
  {
    this.checkType();
  }

  componentDidUpdate(prevProps) 
  {
    if (prevProps.exportType !== this.props.exportType)
    {
      this.checkType();
    }
  }

  checkType()
  {
    if (this.props.exportType === "AllZip" || this.props.exportType === "SelectionZip")
    {
      this.formRef.current.setFieldsValue({filename : 'export.zip'});
      this.setState({password : true})
    }
    else if (this.props.exportType === "AllJson" || this.props.exportType === "SelectionJson")
    {
      this.formRef.current.setFieldsValue({filename : 'export.json'});
      this.setState({password : false})
    }
    else if (this.props.exportType === "AllCsv" || this.props.exportType === "SelectionCsv")
    {
      this.formRef.current.setFieldsValue({filename : 'export.csv'});
      this.setState({password : false})
    }
  }

  buildConfig(config)
  {
    this.props.onOk({exportType : this.props.exportType, config : config});
  }

  render()
  {
    return (
      //formName must be different for every browser or it will call only firstly created form 
      <Form ref={this.formRef} id={this.props.formName} labelCol={{ span: 8, }}
        wrapperCol={{span: 16,}} initialValues={{ remember: true, }}
        onFinish={this.buildConfig.bind(this)}
        autoComplete="off"
      >
        <Form.Item
          label="Filename"
          name="filename"
          //requiered false becaues we have a default value ?
          rules={[{required: false, message: 'File name',},]}
        >
          <Input placeholder="filename" /> 
        </Form.Item>
        { this.state.password && (
          <Form.Item
            label="Password"
            name="password" 
            rules={[ {required: false, message: 'Password'}, ]}
          >
            <Input.Password placeholder="enter a password to encrypt the archive" />
          </Form.Item>
        )}
      </Form>
    );
  }
}

export function ExportConfig(props)
{
  let formName = "ExportConfigForm" + props.browser_id;

  return (
    <Modal title="Export configuration" visible={props.visible} okButtonProps={{form: formName, key: 'submit', htmlType: 'submit'}} onCancel={props.onCancel}>
      <ExportConfigForm onOk={props.onOk} exportType={props.exportType} formName={formName}  />
    </Modal>)
}

export default ExportMenu;
