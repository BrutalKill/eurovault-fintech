#!/usr/bin/env python3
"""
EuroVault Investments - Backend Feature Testing
Tests the newly implemented features mentioned in the review request
"""

import requests
import sys
from datetime import datetime
import json

BACKEND_URL = "https://vault-invest.preview.emergentagent.com"

# Test credentials from review request
ADMIN_USERNAME = "brokereurope"
ADMIN_PASSWORD = "Europeinvest"
CLIENT_EMAIL = "carlos.ferreira.invest@gmail.com"
CLIENT_PASSWORD = "SecurePass123!"

class EuroVaultTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.admin_token = None
        self.client_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        print()

    def admin_login(self):
        """Test admin authentication"""
        try:
            response = requests.post(f"{self.backend_url}/api/admin/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                self.admin_token = response.json()["token"]
                self.log_test("Admin Login", True, f"Token acquired: {self.admin_token[:20]}...")
                return True
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def client_login(self):
        """Test client authentication"""
        try:
            response = requests.post(f"{self.backend_url}/api/auth/login", json={
                "email": CLIENT_EMAIL,
                "password": CLIENT_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.client_token = data["token"]
                self.test_user_id = data["user"]["id"]
                self.log_test("Client Login", True, f"User ID: {self.test_user_id}")
                return True
            else:
                self.log_test("Client Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Client Login", False, f"Exception: {str(e)}")
            return False

    def test_client_me_endpoint(self):
        """Test /api/me endpoint for dashboard data"""
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            response = requests.get(f"{self.backend_url}/api/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                required_fields = ["balance", "profit", "goal_amount", "goal_label", "daily_profit_rate"]
                missing = [f for f in required_fields if f not in user_data]
                
                if not missing:
                    balance = user_data.get("balance", 0)
                    demo_mode = user_data.get("demo_mode", False)
                    self.log_test("Client /api/me", True, f"Balance: €{balance}, Demo: {demo_mode}")
                    return True
                else:
                    self.log_test("Client /api/me", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Client /api/me", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Client /api/me", False, f"Exception: {str(e)}")
            return False

    def test_demo_mode_toggle(self):
        """Test demo mode toggle functionality"""
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            
            # Toggle to demo mode
            response = requests.put(f"{self.backend_url}/api/me/demo", 
                                  headers=headers, 
                                  json={"demo_mode": True})
            
            if response.status_code == 200:
                # Verify balance changed to €10,000
                user_response = requests.get(f"{self.backend_url}/api/me", headers=headers)
                if user_response.status_code == 200:
                    balance = user_response.json().get("balance", 0)
                    if balance == 10000.0:
                        self.log_test("Demo Mode Toggle", True, "Balance set to €10,000")
                        return True
                    else:
                        self.log_test("Demo Mode Toggle", False, f"Expected €10,000, got €{balance}")
                        return False
                else:
                    self.log_test("Demo Mode Toggle", False, "Failed to verify balance")
                    return False
            else:
                self.log_test("Demo Mode Toggle", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Demo Mode Toggle", False, f"Exception: {str(e)}")
            return False

    def test_balance_history(self):
        """Test balance history for dashboard chart"""
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            response = requests.get(f"{self.backend_url}/api/me/balance-history", headers=headers)
            
            if response.status_code == 200:
                history = response.json()
                if isinstance(history, list) and len(history) > 0:
                    sample = history[0] if history else {}
                    if "balance" in sample and "date" in sample:
                        self.log_test("Balance History", True, f"Got {len(history)} history points")
                        return True
                    else:
                        self.log_test("Balance History", False, "Invalid history format")
                        return False
                else:
                    self.log_test("Balance History", False, "No history data")
                    return False
            else:
                self.log_test("Balance History", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Balance History", False, f"Exception: {str(e)}")
            return False

    def test_referral_program(self):
        """Test referral program data"""
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            response = requests.get(f"{self.backend_url}/api/me/referral", headers=headers)
            
            if response.status_code == 200:
                referral = response.json()
                required = ["referral_code", "count", "converted", "bonus"]
                if all(field in referral for field in required):
                    self.log_test("Referral Program", True, f"Code: {referral['referral_code']}, Count: {referral['count']}")
                    return True
                else:
                    self.log_test("Referral Program", False, "Missing referral fields")
                    return False
            else:
                self.log_test("Referral Program", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Referral Program", False, f"Exception: {str(e)}")
            return False

    def test_admin_analytics(self):
        """Test admin analytics endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/api/admin/analytics", headers=headers)
            
            if response.status_code == 200:
                analytics = response.json()
                required_kpis = ["total_users", "deposited", "conversion_rate", "total_balance", "new_today"]
                missing = [kpi for kpi in required_kpis if kpi not in analytics]
                
                if not missing:
                    self.log_test("Admin Analytics", True, 
                                f"Total users: {analytics['total_users']}, Deposited: {analytics['deposited']}")
                    return True
                else:
                    self.log_test("Admin Analytics", False, f"Missing KPIs: {missing}")
                    return False
            else:
                self.log_test("Admin Analytics", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Analytics", False, f"Exception: {str(e)}")
            return False

    def test_csv_export(self):
        """Test CSV export functionality"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/api/admin/export/leads", headers=headers)
            
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "")
                if "text/csv" in content_type or "application/csv" in content_type:
                    csv_content = response.text
                    lines = csv_content.split('\n')
                    if len(lines) >= 2:  # Header + at least one data row
                        self.log_test("CSV Export", True, f"Downloaded {len(lines)} lines")
                        return True
                    else:
                        self.log_test("CSV Export", False, "Empty CSV file")
                        return False
                else:
                    self.log_test("CSV Export", False, f"Wrong content type: {content_type}")
                    return False
            else:
                self.log_test("CSV Export", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("CSV Export", False, f"Exception: {str(e)}")
            return False

    def test_admin_leads_list(self):
        """Test admin leads listing with bulk actions support"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{self.backend_url}/api/admin/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    user_count = len(users)
                    if user_count > 0:
                        sample_user = users[0]
                        required_fields = ["id", "full_name", "email", "status", "balance"]
                        missing = [f for f in required_fields if f not in sample_user]
                        
                        if not missing:
                            self.log_test("Admin Leads List", True, f"Found {user_count} users")
                            return True
                        else:
                            self.log_test("Admin Leads List", False, f"Missing fields: {missing}")
                            return False
                    else:
                        self.log_test("Admin Leads List", True, "No users found (empty list is valid)")
                        return True
                else:
                    self.log_test("Admin Leads List", False, "Response is not a list")
                    return False
            else:
                self.log_test("Admin Leads List", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Leads List", False, f"Exception: {str(e)}")
            return False

    def test_admin_drawer_apis(self):
        """Test admin drawer functionality APIs"""
        if not self.test_user_id:
            self.log_test("Admin Drawer APIs", False, "No test user ID available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test notes endpoint
            notes_response = requests.get(f"{self.backend_url}/api/admin/users/{self.test_user_id}/notes", 
                                        headers=headers)
            
            # Test deposits endpoint
            deposits_response = requests.get(f"{self.backend_url}/api/admin/users/{self.test_user_id}/deposits", 
                                           headers=headers)
            
            # Test followup and audit (if they exist)
            followup_response = requests.get(f"{self.backend_url}/api/admin/followups", headers=headers)
            audit_response = requests.get(f"{self.backend_url}/api/admin/users/{self.test_user_id}/audit", 
                                        headers=headers)
            
            success_count = 0
            total_apis = 4
            
            if notes_response.status_code == 200:
                success_count += 1
            if deposits_response.status_code == 200:
                success_count += 1
            if followup_response.status_code == 200:
                success_count += 1
            if audit_response.status_code == 200:
                success_count += 1
                
            if success_count >= 3:  # At least 3 out of 4 should work
                self.log_test("Admin Drawer APIs", True, f"{success_count}/{total_apis} drawer APIs working")
                return True
            else:
                self.log_test("Admin Drawer APIs", False, f"Only {success_count}/{total_apis} drawer APIs working")
                return False
                
        except Exception as e:
            self.log_test("Admin Drawer APIs", False, f"Exception: {str(e)}")
            return False

    def test_admin_chat_apis(self):
        """Test admin chat functionality"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test conversations list
            conv_response = requests.get(f"{self.backend_url}/api/admin/chat/conversations", headers=headers)
            
            # Test templates list
            templates_response = requests.get(f"{self.backend_url}/api/admin/chat/templates_list", headers=headers)
            
            success = True
            
            if conv_response.status_code != 200:
                success = False
                
            if templates_response.status_code == 200:
                templates = templates_response.json()
                if not isinstance(templates, list) or len(templates) == 0:
                    success = False
            else:
                success = False
                
            if success:
                template_count = len(templates_response.json()) if templates_response.status_code == 200 else 0
                self.log_test("Admin Chat APIs", True, f"Templates: {template_count}, Conversations API working")
                return True
            else:
                self.log_test("Admin Chat APIs", False, "Chat APIs not working properly")
                return False
                
        except Exception as e:
            self.log_test("Admin Chat APIs", False, f"Exception: {str(e)}")
            return False

    def test_favorites_api(self):
        """Test favorites functionality for trade"""
        try:
            headers = {"Authorization": f"Bearer {self.client_token}"}
            
            # Set some favorites
            test_favorites = ["EURUSD", "GBPUSD", "BTCUSD"]
            response = requests.put(f"{self.backend_url}/api/me/favorites", 
                                  headers=headers, 
                                  json={"favorites": test_favorites})
            
            if response.status_code == 200:
                self.log_test("Trade Favorites API", True, f"Set {len(test_favorites)} favorites")
                return True
            else:
                self.log_test("Trade Favorites API", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Trade Favorites API", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting EuroVault Backend Feature Tests")
        print("=" * 60)
        
        # Authentication tests
        if not self.admin_login():
            print("❌ Cannot proceed without admin authentication")
            return False
            
        if not self.client_login():
            print("❌ Cannot proceed without client authentication")
            return False
        
        # Feature tests
        self.test_client_me_endpoint()
        self.test_demo_mode_toggle()
        self.test_balance_history()
        self.test_referral_program()
        self.test_admin_analytics()
        self.test_csv_export()
        self.test_admin_leads_list()
        self.test_admin_drawer_apis()
        self.test_admin_chat_apis()
        self.test_favorites_api()
        
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = EuroVaultTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())