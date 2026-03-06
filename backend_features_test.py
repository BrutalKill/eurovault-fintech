#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EuroVaultFeaturesTest:
    def __init__(self):
        self.base_url = "https://invest-dashboard-eu.preview.emergentagent.com"
        self.admin_token = None
        self.client_token = None
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

    def test_admin_login(self):
        """Test admin login with provided credentials"""
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

    def test_client_login(self):
        """Test client login with provided credentials"""
        success, response = self.run_test(
            "Client Login", "POST", "/api/auth/login", 200,
            data={
                "email": "carlos.ferreira.invest@gmail.com",
                "password": "SecurePass123!"
            }
        )
        
        if success and 'token' in response:
            self.client_token = response['token']
            if 'user' in response and 'id' in response['user']:
                self.test_user_id = response['user']['id']
            self.log(f"    ✓ Got client token and user ID: {self.test_user_id}")
            return True
        return False

    def test_admin_get_users(self):
        """Test admin get all users to find valid user IDs"""
        if not self.admin_token:
            self.log("❌ No admin token available")
            return False
            
        success, response = self.run_test(
            "Admin Get Users", "GET", "/api/admin/users", 200,
            use_admin=True
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            # Get the first user ID for testing
            if not self.test_user_id:
                self.test_user_id = response[0]['id']
            self.log(f"    ✓ Retrieved {len(response)} users, using ID: {self.test_user_id}")
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

def main():
    """Main test runner for new features"""
    tester = EuroVaultFeaturesTest()
    
    print("🚀 Starting EuroVault New Features API Tests")
    print(f"🌐 Base URL: {tester.base_url}")
    print("=" * 60)
    
    # Test order is important - some tests depend on previous ones
    test_methods = [
        tester.test_admin_login,
        tester.test_client_login,
        tester.test_admin_get_users,
        # New features tests
        tester.test_admin_impersonation,
        tester.test_admin_notes_functionality,
        tester.test_admin_deposits_history,
        tester.test_admin_withdrawal_limit,
        tester.test_client_investment_goals,
        tester.test_client_sessions_history,
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            tester.log(f"❌ Test {test_method.__name__} failed with exception: {e}")
        
        print("-" * 40)
    
    # Print summary
    print("=" * 60)
    print("📊 FEATURES TEST SUMMARY")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0.0%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL NEW FEATURES WORKING!")
        return 0
    else:
        print("❌ Some new features have issues")
        return 1

if __name__ == "__main__":
    sys.exit(main())