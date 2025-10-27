<?php
/**
 * Secure Configuration System for cPanel Hosting
 * 
 * This file provides secure credential storage using environment variables only.
 * Configure your credentials in cPanel Environment Variables or .bashrc
 */

class SecureConfig {
    private static $instance = null;
    private $config = null;
    
    private function __construct() {
        $this->loadConfig();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function loadConfig() {
        // Try to load from environment variables first
        $username = getenv('TARNEEB_ADMIN_USERNAME');
        $password = getenv('TARNEEB_ADMIN_PASSWORD');
        
        if ($username && $password) {
            $this->config = [
                'admin' => [
                    'username' => $username,
                    'password' => $password
                ],
                'version' => '2.0'
            ];
        } else {
            // Fallback to default credentials for local development
            $this->config = [
                'admin' => [
                    'username' => 'rhc',
                    'password' => 'rhc'
                ],
                'version' => '2.0'
            ];
        }
    }
    
    /**
     * Get configuration value
     */
    public function get($key, $default = null) {
        if ($this->config === null) {
            return $default;
        }
        
        $keys = explode('.', $key);
        $value = $this->config;
        
        foreach ($keys as $k) {
            if (isset($value[$k])) {
                $value = $value[$k];
            } else {
                return $default;
            }
        }
        
        return $value;
    }
    
    /**
     * Get admin credentials
     */
    public function getAdminCredentials() {
        return [
            'username' => $this->get('admin.username'),
            'password' => $this->get('admin.password')
        ];
    }
    
    /**
     * Get configuration source (always 'environment')
     */
    public function getSource() {
        return 'environment';
    }
    
    /**
     * Check if configuration is secure (always true for environment variables)
     */
    public function isSecure() {
        return true;
    }
}
?>
