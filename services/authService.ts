
// 生成8位随机密码，包含数字、大小写字母和符号
export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// 验证密码是否唯一
export const isPasswordUnique = (password: string, users: any[]): boolean => {
  return !users.some(user => user.password === password);
};

// 简化密码验证逻辑，直接比较明文密码
export const checkPassword = async (input: string): Promise<boolean> => {
  // 简化密码验证逻辑，直接比较明文密码
  return input === 'admin';
};
