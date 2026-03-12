#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BrokerEuropeAPITester:
    def __init__(self):
        self.base_url = "https://vault-invest.preview.emergentagent.com"
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

    def test_admin_impersonation(self):
        """Test admin impersonation functionality"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for impersonation test")
            return False
            
        success, response = self.run_test(
            "Admin Impersonation", "POST", f"/api/admin/users/{self.test_user_id}/impersonate", 200,
            use_admin=True
        )
        
        if success and 'token' in response:
            # Test that the impersonation token works
            imperson_token = response['token']
            test_headers = {'Authorization': f'Bearer {imperson_token}'}
            
            verify_success, verify_response = self.run_test(
                "Verify Impersonation Token", "GET", "/api/me", 200,
                headers=test_headers
            )
            
            if verify_success:
                self.log("    ✓ Impersonation token works correctly")
                return True
        return False

    def test_admin_notes_functionality(self):
        """Test admin notes save and retrieve"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for notes test")
            return False
            
        test_notes = "Test notes for this client - testing functionality"
        
        # Save notes
        save_success, _ = self.run_test(
            "Admin Save Notes", "PUT", f"/api/admin/users/{self.test_user_id}/notes", 200,
            data={"notes": test_notes},
            use_admin=True
        )
        
        if not save_success:
            return False
            
        # Retrieve notes
        get_success, response = self.run_test(
            "Admin Get Notes", "GET", f"/api/admin/users/{self.test_user_id}/notes", 200,
            use_admin=True
        )
        
        if get_success and response.get('notes') == test_notes:
            self.log("    ✓ Notes saved and retrieved correctly")
            return True
        return False

    def test_admin_deposits_history(self):
        """Test admin get user deposits history"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for deposits test")
            return False
            
        success, response = self.run_test(
            "Admin Get User Deposits", "GET", f"/api/admin/users/{self.test_user_id}/deposits", 200,
            use_admin=True
        )
        
        if success and isinstance(response, list):
            self.log(f"    ✓ Retrieved {len(response)} deposit records")
            return True
        return False

    def test_admin_withdrawal_limit(self):
        """Test admin set withdrawal limit"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for withdrawal limit test")
            return False
            
        success, response = self.run_test(
            "Admin Set Withdrawal Limit", "PUT", f"/api/admin/users/{self.test_user_id}/withdrawal-limit", 200,
            data={"daily_withdrawal_limit": 500.0},
            use_admin=True
        )
        
        if success:
            self.log("    ✓ Withdrawal limit set successfully")
            return True
        return False

    def test_client_investment_goals(self):
        """Test client investment goals functionality"""
        if not self.client_token:
            self.log("❌ No client token available for goals test")
            return False
            
        success, response = self.run_test(
            "Client Set Investment Goal", "PUT", "/api/me/goal", 200,
            data={
                "goal_amount": 10000.0,
                "goal_label": "Retirement Savings"
            }
        )
        
        if success:
            # Verify goal was set by checking profile
            profile_success, profile_response = self.run_test(
                "Verify Goal in Profile", "GET", "/api/me", 200
            )
            
            if profile_success and profile_response.get('goal_amount') == 10000.0:
                self.log("    ✓ Investment goal set and verified")
                return True
        return False

    def test_client_sessions_history(self):
        """Test client sessions history"""
        if not self.client_token:
            self.log("❌ No client token available for sessions test")
            return False
            
        success, response = self.run_test(
            "Client Get Sessions", "GET", "/api/me/sessions", 200
        )
        
        if success and isinstance(response, list):
            self.log(f"    ✓ Retrieved {len(response)} session records")
            return True
        return False

    def test_admin_daily_rate(self):
        """Test admin set daily profit rate"""
        if not self.admin_token or not self.test_user_id:
            self.log("❌ No admin token or user ID available for daily rate test")
            return False
            
        success, response = self.run_test(
            "Admin Set Daily Rate", "PUT", f"/api/admin/users/{self.test_user_id}/daily-rate", 200,
            data={"daily_profit_rate": 1.5},
            use_admin=True
        )
        
        if success and response.get('daily_profit_rate') == 1.5:
            self.log("    ✓ Daily profit rate set successfully")
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
        # New features tests
        tester.test_admin_impersonation,
        tester.test_admin_notes_functionality,
        tester.test_admin_deposits_history,
        tester.test_admin_withdrawal_limit,
        tester.test_client_investment_goals,
        tester.test_client_sessions_history,
        tester.test_admin_daily_rate,
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