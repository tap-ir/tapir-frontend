import React from "react";

import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Form, Input, Button, Space, Select, Modal } from 'antd';

const {Option} = Select;

function QueryBuilder(props)
{
  let formName = "QueryBuilderForm" + props.browser_id;

  return (
    <Modal forceRender title="Query editor" visible={props.visible} okButtonProps={{form : formName, key: 'submit', htmlType: 'submit'}} onCancel={props.onCancel} width={820}>
      <QueryBuilderForm onOk={props.onOk} formName={formName} />
    </Modal>
  )
}

export default QueryBuilder;

function ItemAttributeType(props)
{
  return(
    <Form.Item
      {...props.restField}
      name={[props.name, props.name_value]}
      rules={[{ required: true, message: 'Select expression' }]}
      initialValue={'w'}
      title='Choose matching method'
    >
      <Select title='Choose matching method'>
        <Option title='match using wildcard (* and ?)' value='w'>Wildcard</Option>
        <Option title='match using regexp' value='r'>Regexp</Option>
        <Option title='match approximately' value='f'>Fuzzy</Option>
        <Option title='match fix value' value='u'>Fixed</Option>
      </Select>
    </Form.Item>
  )
}

function ItemDataType(props)
{
  return (
    <Form.Item
      {...props.restField}
      name={[props.name, props.name_value]}
      rules={[{ required: true, message: 'Select expression' }]}
      initialValue={'r'}
      title='Choose matching method'
    >
      <Select  defaultValue={'Binary'} title={'Choose matching method'}>  
        <Option title='match binary data and unicode 8 text using regexp' value='r'>Binary</Option>
        <Option title='match encoded text (unicode 8 and 16) using regexp' value='t'>Text</Option>
      </Select>
   </Form.Item>
  )
}

function ItemOperator(props)
{
  let display = null;

  return ( 
    <Form.Item  
      {...props.restField}
      name={[props.name, props.name_value]}
      rules={[{ required: true, message: 'Select operator' }]}
      initialValue={'and'}
      title='Choose operator to use against previous expression'
    >
      <Select style={{display: display}}   title='Choose operator to use against previous expression'
 > 
        <Option value='and'>And</Option>
        <Option value='or'>Or</Option>
        <Option value='and not'>And not</Option>
      </Select>
    </Form.Item>
  )
}

function ItemExpression(props)
{
  return (
    <Form.Item
      {...props.restField}
      name={[props.name, props.name_value]}
      rules={[{ required: true, message: 'Select expression' }]}
      initialValue={'name'}
      title='Choose expression to match on'
    >
      <Select onChange={ (value) => { props.onChange(props.key_id, value) }  }  title='Choose expression to match on'
 >
        <Option title='Match file name' value='name'>Name</Option>
        <Option title='Match attribute name' value='attribute.name'>Attribute name</Option>
        <Option title='Match specific attribute with specific value' value='attribute:'>Attribute value</Option>
        <Option title='Match content of file' value='data'>Data</Option>
      </Select>
    </Form.Item>
  )
}

function ItemValue(props)
{
  return (
    <Form.Item
      {...props.restField}
      name={[props.name, props.name_value]}
      rules={[{ required: true, message: 'Missing value' }]}
      title='Value to match'
    >
      <Input placeholder={props.place_holder} title='Value to match' />
    </Form.Item>
  )
}

class QueryBuilderForm extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = { expression : {} };
  }

  buildQuery(form) 
  {
    let query = null;
    if (form.inputs)
    {
      let i = 0;
      query = "";
      for (const input of form.inputs)
      {
        if (input.operator && i) 
        {
          query += " " + input.operator + " ";
        }

        if (form.inputs.length > 1)
        {
          query += "(";
        }

        if (input.expression === 'attribute:') 
        {
          query += input.expression + input.left_type + "'" + input.left_value + "' == " + input.right_type_attribute + "'" + input.right_value  + "'"
        }
        else
        {
          if (input.expression === 'data')
          {
            query += input.expression + " == " + input.right_type_data + "'" + input.right_value  + "'"
          }
          else
          {
            query += input.expression + " == " + input.right_type_attribute + "'" + input.right_value  + "'"
          }
        }
        
        if (form.inputs.length > 1)
        {
          query += ")";
        }
        i += 1;
      }
    }
    this.props.onOk(query);
  }

  changeExpression(key, value)
  {
    let expr = this.state.expression;
    expr[key] = value;
    this.setState({expression : expr});
  }

  render()
  {
    return(
      <Form id={this.props.formName} onFinish={this.buildQuery.bind(this)} autoComplete="off">
        <Form.List name="inputs">
          {(fields, { add, remove }) => (
            <>
              {!fields.length  && (fields.push({ fieldKey : 0, isListField : true, key : 0, name : 0}) && null)}
              {fields.map(({ key, name, ...restField }, index) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">

                  {index !== 0 ? (<ItemOperator name={name} name_value={'operator'} restField={restField} key_id={key} />) : null }
                  <ItemExpression name={name} name_value={'expression'} restField={restField} onChange={this.changeExpression.bind(this)} key_id={key}/>
               
                  { this.state.expression[key] === 'attribute:' && (
                    <>
                      <ItemValue name={name} name_value={'left_value'} place_holder={'name'} restField={restField}/>
                      <ItemAttributeType name={name} name_value={'left_type'} restField={restField} />
                    </>
                  )}

                  <Button >==</Button>
                 
                  { ((this.state.expression[key] === 'attribute:') || (this.state.expression[key] === 'data'))  && (
                    <ItemValue name={name} name_value={'right_value'} place_holder={'value'} restField={restField}/>
                  )}

                  { ((this.state.expression[key] !== 'attribute:') && (this.state.expression[key] !== 'data')) && (
                    <ItemValue name={name} name_value={'right_value'} place_holder={'name'} restField={restField}/>
                  )}
                  
                  {/*//we must differentiate them, because if name_value is same, select keep previous selection*/}
                  { this.state.expression[key] === 'data' && (
                    <ItemDataType name={name} name_value={'right_type_data'} restField={restField} />
                  )}
                  { this.state.expression[key] !== 'data' && (
                    <ItemAttributeType name={name} name_value={'right_type_attribute'} restField={restField} />
                  )}

                  {/*<PlusCircleOutlined style={{color : 'green'}} onClick={() => add()} />*/}
                 <MinusCircleOutlined title='remove expression' style={{color : 'white'}}  onClick={() => remove(name)} />
                </Space>
              ))}

              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add expression 
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    );
  }
}
