import { notification } from 'antd';

export function notify(type, title, message)
{
  notification[type]({
    message: title,
    description: message, 
  });  
}

export function notifyError(title, message)
{
  notify('error', title, message);
}

export function notifySucess(title, message)
{
  notify('success', title, message);
}

export function notifyInfo(title, message)
{
  notify('info', title, message);
}

export function notifyWarning(title, message)
{
  notify('warning', title, message);
}
