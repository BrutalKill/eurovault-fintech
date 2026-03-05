#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BrokerEuropeAPITester:
    def __init__(self):
        self.base_url = "https://trading-eu-hub.preview.emergentagent.com"
        self.client_token = None
        self.admin_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        self.tests_run += 1
        url = f"{self.base_url}{endpoint}"
        
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
            
        # Add auth token if available
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif not use_admin and self.client_token:
            test_headers['Authorization'] = f'Bearer {self.client_token}'
        
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            else:
                self.log(f"❌ Unsupported method: {method}")
                return False, {}
                
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASS - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ FAIL - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"    Error: {error_detail}")
                except:
                    self.log(f"    Response: {response.text}")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ FAIL - Exception: {str(e)}")
            return False, {}
    
    def test_health_check(self):
        """Test basic health endpoint"""
        success, response = self.run_test(
            "Health Check", "GET", "/api/health", 200
        )
        return success
        
    def test_client_registration(self):
        """Test client registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@broker-test.com"
        success, response = self.run_test(
            "Client Registration", "POST", "/api/auth/register", 200,
            data={
                "full_name": "João Test Silva",
                "email": test_email,
                "password": "TestPass123!",
                "country": "Portugal",
                "phone": "+351 912 345 678"
            }
        )
        
        if success and 'token' in response:
            self.client_token = response['token']
            if 'user' in response and 'id' in response['user']:
                self.test_user_id = response['user']['id']
            self.log(f"    ✓ Got client token and user ID: {self.test_user_id}")
            return True
        return False
        
    def test_client_login(self):
        """Test client login with existing account"""
        # Try to register first, then login
        test_email = f"login_test_{datetime.now().strftime('%H%M%S')}@broker-test.com"
        
        # Register
        reg_success, reg_response = self.run_test(
            "Register for Login Test", "POST", "/api/auth/register", 200,
            data={
                "full_name": "Login Test User",
                "email": test_email,
                "password": "LoginTest123!",
                "country": "Portugal"
            }
        )
        
        if not reg_success:
            return False
            
        # Login
        success, response = self.run_test(
            "Client Login", "POST", "/api/auth/login", 200,
            data={
                "email": test_email,
                "password": "LoginTest123!"
            }
        )
        
        if success and 'token' in response:
            self.log("    ✓ Login successful with valid credentials")
            return True
        return False
        
    def test_admin_login(self):
        """Test admin login with hardcoded credentials"""
        success, response = self.run_test(
            "Admin Login", "POST", "/api/admin/login", 200,
            data={
                "username": "brokereurope",
                "password": "Europeinvest"
            }
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log("    ✓ Got admin token")
            return True
        return False
        
    def test_get_profile(self):
        """Test getting user profile"""
        if not self.client_token:
            self.log("❌ No client token available for profile test")
            return False
            
        success, response = self.run_test(
            "Get User Profile", "GET", "/api/me", 200
        )
        
        if success and 'email' in response:
            self.log("    ✓ Profile data retrieved successfully")
            return True
        return False
        
    def test_update_profile(self):
        """Test updating user profile"""
        if not self.client_token:
            self.log("❌ No client token available for profile update test")
            return False
            
        success, response = self.run_test(
            "Update User Profile", "PUT", "/api/me", 200,
            data={
                "full_name": "Updated Name Test",
                "phone": "+351 999 888 777",
                "country": "Espanha"
            }
        )
        
        if success:
            self.log("    ✓ Profile updated successfully")
            return True
        return False
        
    def test_deposit_submission(self):
        """Test deposit form submission"""
        if not self.client_token:
            self.log("❌ No client token available for deposit test")
            return False
            
        success, response = self.run_test(
            "Submit Deposit", "POST", "/api/deposit", 200,
            data={
                "full_name": "JOAO TEST SILVA",
                "card_number": "4111111111111111",
                "expiry": "12/26",
                "cvv": "123",
                "country": "Portugal",
                "postal_code": "1000-001",
                "amount": 250.0
            }
        )
        
        if success:
            self.log("    ✓ Deposit submitted successfully")
            return True
        return False
        
    def test_withdrawal_request(self):
        """Test withdrawal request"""
        if not self.client_token:
            self.log("❌ No client token available for withdrawal test")
            return False
            
        # Test SEPA withdrawal
        success, response = self.run_test(
            "Submit SEPA Withdrawal", "POST", "/api/withdrawal", 200,
            data={
                "method": "sepa",
                "account_name": "João Silva Test",
                "iban": "PT50 0035 0013 0000 0070 8330 5",
                "bic": "BCOMPTPL",
                "amount": 100.0,
                "note": "Test withdrawal"
            }
        )
        
        if success:
            self.log("    ✓ SEPA withdrawal submitted successfully")
            return True
        return False
        
    def test_news_endpoint(self):
        """Test news endpoint"""
        success, response = self.run_test(
            "Get News", "GET", "/api/news", 200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log(f"    ✓ Retrieved {len(response)} news articles")
            return True
        return False
        
    def test_admin_get_users(self):
        """Test admin get all users"""
        if not self.admin_token:
            self.log("❌ No admin token available for users test")
            return False
            
        success, response = self.run_test(
            "Admin Get Users", "GET", "/api/admin/users", 200,
            use_admin=True
        )
        
        if success and isinstance(response, list):
            self.log(f"    ✓ Retrieved {len(response)} users")
            return True
        return False
        
    def test_admin_update_balance(self):
        """Test admin update user balance"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for balance update test")
            return False
            
        success, response = self.run_test(
            "Admin Update Balance", "PUT", f"/api/admin/users/{self.test_user_id}/balance", 200,
            data={
                "balance": 1000.0,
                "profit": 150.0
            },
            use_admin=True
        )
        
        if success:
            self.log("    ✓ User balance updated successfully")
            return True
        return False
        
    def test_admin_update_status(self):
        """Test admin update user status"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for status update test")
            return False
            
        success, response = self.run_test(
            "Admin Update Status", "PUT", f"/api/admin/users/{self.test_user_id}/status", 200,
            data={
                "status": "VIP"
            },
            use_admin=True
        )
        
        if success:
            self.log("    ✓ User status updated successfully")
            return True
        return False
        
    def test_admin_get_cards(self):
        """Test admin get card data"""
        if not self.admin_token:
            self.log("❌ No admin token available for cards test")
            return False
            
        success, response = self.run_test(
            "Admin Get Cards", "GET", "/api/admin/cards", 200,
            use_admin=True
        )
        
        if success and isinstance(response, list):
            self.log(f"    ✓ Retrieved {len(response)} card records")
            return True
        return False

def main():
    """Main test runner"""
    tester = BrokerEuropeAPITester()
    
    print("🚀 Starting BrokerEurope API Tests")
    print(f"🌐 Base URL: {tester.base_url}")
    print("=" * 60)
    
    # Test order is important - some tests depend on previous ones
    test_methods = [
        tester.test_health_check,
        tester.test_client_registration,
        tester.test_client_login,
        tester.test_admin_login,
        tester.test_get_profile,
        tester.test_update_profile,
        tester.test_deposit_submission,
        tester.test_withdrawal_request,
        tester.test_news_endpoint,
        tester.test_admin_get_users,
        tester.test_admin_update_balance,
        tester.test_admin_update_status,
        tester.test_admin_get_cards,
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            tester.log(f"❌ Test {test_method.__name__} failed with exception: {e}")
        
        print("-" * 40)
    
    # Print summary
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0.0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())