<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理OPTIONS请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 数据存储文件路径
$dataFile = '/var/www/html/data.json';
$adminUsersFile = '/var/www/html/admin_users.json'; // 管理员管理的用户
$userIdentitiesFile = '/var/www/html/user_identities.json'; // 用户身份信息
$uploadDir = '/var/www/html/uploads/';

// 确保目录存在
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// 确保数据文件存在
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
    chmod($dataFile, 0777);
}

// 确保管理员用户文件存在
if (!file_exists($adminUsersFile)) {
    file_put_contents($adminUsersFile, json_encode([]));
    chmod($adminUsersFile, 0777);
}

// 确保用户身份文件存在
if (!file_exists($userIdentitiesFile)) {
    file_put_contents($userIdentitiesFile, json_encode([]));
    chmod($userIdentitiesFile, 0777);
}

// 获取请求参数
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_projects':
        // 获取所有项目
        $projects = json_decode(file_get_contents($dataFile), true);
        echo json_encode($projects);
        break;
        
    case 'save_project':
        // 保存项目
        $projects = json_decode(file_get_contents($dataFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 查找并更新或添加项目
        $found = false;
        for ($i = 0; $i < count($projects); $i++) {
            if ($projects[$i]['id'] === $data['id']) {
                $projects[$i] = $data;
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $projects[] = $data;
        }
        
        // 保存到文件
        file_put_contents($dataFile, json_encode($projects, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
        
    case 'delete_project':
        // 删除项目
        $projects = json_decode(file_get_contents($dataFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 过滤掉要删除的项目
        $newProjects = [];
        foreach ($projects as $project) {
            if ($project['id'] !== $data['id']) {
                $newProjects[] = $project;
            }
        }
        
        // 保存到文件
        file_put_contents($dataFile, json_encode($newProjects, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
        
    case 'upload_image':
        // 上传图片
        if (!isset($_FILES['file'])) {
            echo json_encode(['error' => 'No file uploaded']);
            break;
        }
        
        $file = $_FILES['file'];
        
        // 验证文件类型
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        $fileType = mime_content_type($file['tmp_name']);
        
        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode(['error' => 'Only JPG and PNG files are allowed']);
            break;
        }
        
        // 生成唯一文件名
        $fileName = uniqid() . '_' . basename($file['name']);
        $filePath = $uploadDir . $fileName;
        
        // 移动文件
        if (move_uploaded_file($file['tmp_name'], $filePath)) {
            // 返回文件URL
            $fileUrl = '/uploads/' . $fileName;
            echo json_encode(['url' => $fileUrl, 'success' => true]);
        } else {
            echo json_encode(['error' => 'Failed to upload file']);
        }
        break;
        
    case 'get_users':
        // 获取所有用户身份信息
        $userIdentities = json_decode(file_get_contents($userIdentitiesFile), true);
        echo json_encode($userIdentities);
        break;
        
    case 'save_user':
        // 保存用户身份信息
        $userIdentities = json_decode(file_get_contents($userIdentitiesFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['deviceId']) || !isset($data['name'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 查找并更新或添加用户身份
        $found = false;
        for ($i = 0; $i < count($userIdentities); $i++) {
            if ($userIdentities[$i]['deviceId'] === $data['deviceId']) {
                $userIdentities[$i] = $data;
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $userIdentities[] = $data;
        }
        
        // 保存到文件
        file_put_contents($userIdentitiesFile, json_encode($userIdentities, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'get_all_users':
        // 获取所有管理员管理的用户
        $adminUsers = json_decode(file_get_contents($adminUsersFile), true);
        echo json_encode($adminUsers);
        break;
    
    case 'create_user':
        // 创建管理员管理的用户
        $adminUsers = json_decode(file_get_contents($adminUsersFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['name']) || !isset($data['password'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 生成唯一ID
        $data['id'] = uniqid();
        $data['createdAt'] = time();
        $data['updatedAt'] = time();
        
        // 添加到管理员用户列表
        $adminUsers[] = $data;
        
        // 保存到文件
        file_put_contents($adminUsersFile, json_encode($adminUsers, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'update_user':
        // 更新管理员管理的用户
        $adminUsers = json_decode(file_get_contents($adminUsersFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 查找并更新用户
        $found = false;
        for ($i = 0; $i < count($adminUsers); $i++) {
            if ($adminUsers[$i]['id'] === $data['id']) {
                $data['updatedAt'] = time();
                $adminUsers[$i] = array_merge($adminUsers[$i], $data);
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            echo json_encode(['error' => 'User not found']);
            break;
        }
        
        // 保存到文件
        file_put_contents($adminUsersFile, json_encode($adminUsers, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'delete_user':
        // 删除管理员管理的用户
        $adminUsers = json_decode(file_get_contents($adminUsersFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 过滤掉要删除的用户
        $newAdminUsers = [];
        foreach ($adminUsers as $user) {
            if ($user['id'] !== $data['id']) {
                $newAdminUsers[] = $user;
            }
        }
        
        // 保存到文件
        file_put_contents($adminUsersFile, json_encode($newAdminUsers, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'verify_password':
        // 验证密码
        $adminUsers = json_decode(file_get_contents($adminUsersFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['password'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 查找匹配的用户
        $matchedUser = null;
        foreach ($adminUsers as $user) {
            if (isset($user['password']) && $user['password'] === $data['password']) {
                $matchedUser = $user;
                break;
            }
        }
        
        if ($matchedUser) {
            echo json_encode(['user' => $matchedUser, 'success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
        break;
    
    // Notification endpoints
    case 'get_notifications':
        // 获取所有通知
        $notificationsFile = '/var/www/html/notifications.json';
        if (!file_exists($notificationsFile)) {
            file_put_contents($notificationsFile, json_encode([]));
            chmod($notificationsFile, 0777);
        }
        $notifications = json_decode(file_get_contents($notificationsFile), true);
        echo json_encode($notifications);
        break;
    
    case 'create_notification':
        // 创建通知
        $notificationsFile = '/var/www/html/notifications.json';
        if (!file_exists($notificationsFile)) {
            file_put_contents($notificationsFile, json_encode([]));
            chmod($notificationsFile, 0777);
        }
        $notifications = json_decode(file_get_contents($notificationsFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['projectId']) || !isset($data['taskId']) || !isset($data['assignee'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 添加到通知列表
        $notifications[] = $data;
        
        // 保存到文件
        file_put_contents($notificationsFile, json_encode($notifications, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'mark_notification_read':
        // 标记通知为已读
        $notificationsFile = '/var/www/html/notifications.json';
        if (!file_exists($notificationsFile)) {
            file_put_contents($notificationsFile, json_encode([]));
            chmod($notificationsFile, 0777);
            echo json_encode(['success' => true]);
            break;
        }
        $notifications = json_decode(file_get_contents($notificationsFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['id'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 查找并更新通知
        for ($i = 0; $i < count($notifications); $i++) {
            if ($notifications[$i]['id'] === $data['id']) {
                $notifications[$i]['read'] = true;
                break;
            }
        }
        
        // 保存到文件
        file_put_contents($notificationsFile, json_encode($notifications, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    // Activity Log endpoints
    case 'get_activity_logs':
        // 获取所有活动日志
        $logsFile = '/var/www/html/activity_logs.json';
        if (!file_exists($logsFile)) {
            file_put_contents($logsFile, json_encode([]));
            chmod($logsFile, 0777);
        }
        $logs = json_decode(file_get_contents($logsFile), true);
        echo json_encode($logs);
        break;
    
    case 'create_activity_log':
        // 创建活动日志
        $logsFile = '/var/www/html/activity_logs.json';
        if (!file_exists($logsFile)) {
            file_put_contents($logsFile, json_encode([]));
            chmod($logsFile, 0777);
        }
        $logs = json_decode(file_get_contents($logsFile), true);
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['user']) || !isset($data['action'])) {
            echo json_encode(['error' => 'Invalid JSON data']);
            break;
        }
        
        // 添加到日志列表
        $logs[] = $data;
        
        // 限制日志数量，只保留最近1000条
        if (count($logs) > 1000) {
            $logs = array_slice($logs, -1000);
        }
        
        // 保存到文件
        file_put_contents($logsFile, json_encode($logs, JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true]);
        break;
    
    case 'clear_activity_logs':
        // 清空活动日志
        $logsFile = '/var/www/html/activity_logs.json';
        // 清空日志文件
        file_put_contents($logsFile, json_encode([]));
        chmod($logsFile, 0777);
        echo json_encode(['success' => true]);
        break;
        
    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
?>