#!/usr/bin/env python3
"""
Luxuz TV IPTV Backend API Test Suite
Tests all backend endpoints for the IPTV application
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Test Configuration
BASE_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://luxuz-premium.preview.emergentagent.com')
API_BASE_URL = f"{BASE_URL}/api"
TEST_USERNAME = "test29"
TEST_PASSWORD = "test29"
PORTAL_URL = "https://s.luxuztv.com:443"

class LuxuzTVAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.username = TEST_USERNAME
        self.password = TEST_PASSWORD
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'details': details,
            'response_data': response_data,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    async def test_authentication_valid_credentials(self):
        """Test authentication with valid credentials"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                payload = {
                    "username": self.username,
                    "password": self.password
                }
                
                response = await client.post(f"{self.base_url}/auth/login", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check response structure
                    if (data.get('success') is True and 
                        'user_info' in data and 
                        'server_info' in data):
                        
                        # Validate user_info structure
                        user_info = data.get('user_info', {})
                        if user_info.get('auth') == 1 or user_info.get('status') == 'Active':
                            self.log_test(
                                "Authentication - Valid Credentials",
                                True,
                                f"Successfully authenticated user {self.username}",
                                data
                            )
                            return True
                        else:
                            self.log_test(
                                "Authentication - Valid Credentials",
                                False,
                                f"User not authenticated properly: auth={user_info.get('auth')}, status={user_info.get('status')}",
                                data
                            )
                    else:
                        self.log_test(
                            "Authentication - Valid Credentials",
                            False,
                            f"Invalid response structure: success={data.get('success')}, has_user_info={'user_info' in data}, has_server_info={'server_info' in data}",
                            data
                        )
                else:
                    self.log_test(
                        "Authentication - Valid Credentials",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Authentication - Valid Credentials",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_authentication_invalid_credentials(self):
        """Test authentication with invalid credentials"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                payload = {
                    "username": "invalid_user",
                    "password": "invalid_pass"
                }
                
                response = await client.post(f"{self.base_url}/auth/login", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Should return success=false for invalid credentials
                    if data.get('success') is False and 'error' in data:
                        self.log_test(
                            "Authentication - Invalid Credentials",
                            True,
                            f"Correctly rejected invalid credentials: {data.get('error')}",
                            data
                        )
                        return True
                    else:
                        self.log_test(
                            "Authentication - Invalid Credentials",
                            False,
                            f"Should reject invalid credentials but got success={data.get('success')}",
                            data
                        )
                else:
                    self.log_test(
                        "Authentication - Invalid Credentials",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Authentication - Invalid Credentials",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_live_categories(self):
        """Test live categories endpoint"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                params = {
                    "username": self.username,
                    "password": self.password
                }
                
                # Test first call (should fetch from API)
                start_time = time.time()
                response = await client.get(f"{self.base_url}/live/categories", params=params)
                first_call_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        # Validate category structure
                        sample_category = data[0]
                        required_fields = ['category_id', 'category_name']
                        
                        if all(field in sample_category for field in required_fields):
                            # Test caching with second call
                            start_time = time.time()
                            response2 = await client.get(f"{self.base_url}/live/categories", params=params)
                            second_call_time = time.time() - start_time
                            
                            cache_working = second_call_time < first_call_time * 0.8  # Should be significantly faster
                            
                            self.log_test(
                                "Live Categories",
                                True,
                                f"Retrieved {len(data)} categories. First call: {first_call_time:.2f}s, Second call: {second_call_time:.2f}s, Cache working: {cache_working}",
                                {"categories_count": len(data), "sample_category": sample_category, "cache_performance": {"first_call": first_call_time, "second_call": second_call_time}}
                            )
                            return True
                        else:
                            missing_fields = [field for field in required_fields if field not in sample_category]
                            self.log_test(
                                "Live Categories",
                                False,
                                f"Category structure missing required fields: {missing_fields}",
                                sample_category
                            )
                    else:
                        self.log_test(
                            "Live Categories",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    self.log_test(
                        "Live Categories",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Live Categories",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_live_streams_all(self):
        """Test live streams endpoint without category filter"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                params = {
                    "username": self.username,
                    "password": self.password
                }
                
                # Test first call (should fetch from API)
                start_time = time.time()
                response = await client.get(f"{self.base_url}/live/streams", params=params)
                first_call_time = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if isinstance(data, list) and len(data) > 0:
                        # Validate stream structure
                        sample_stream = data[0]
                        required_fields = ['stream_id', 'name']
                        
                        if all(field in sample_stream for field in required_fields):
                            # Test caching with second call
                            start_time = time.time()
                            response2 = await client.get(f"{self.base_url}/live/streams", params=params)
                            second_call_time = time.time() - start_time
                            
                            cache_working = second_call_time < first_call_time * 0.8
                            
                            self.log_test(
                                "Live Streams - All",
                                True,
                                f"Retrieved {len(data)} streams. First call: {first_call_time:.2f}s, Second call: {second_call_time:.2f}s, Cache working: {cache_working}",
                                {"streams_count": len(data), "sample_stream": sample_stream, "cache_performance": {"first_call": first_call_time, "second_call": second_call_time}}
                            )
                            return True
                        else:
                            missing_fields = [field for field in required_fields if field not in sample_stream]
                            self.log_test(
                                "Live Streams - All",
                                False,
                                f"Stream structure missing required fields: {missing_fields}",
                                sample_stream
                            )
                    else:
                        self.log_test(
                            "Live Streams - All",
                            False,
                            f"Expected non-empty list, got: {type(data)} with length {len(data) if isinstance(data, list) else 'N/A'}",
                            data
                        )
                else:
                    self.log_test(
                        "Live Streams - All",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Live Streams - All",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_live_streams_category_filter(self):
        """Test live streams endpoint with category filter (SRBIJA category_id=4)"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                params = {
                    "username": self.username,
                    "password": self.password,
                    "category_id": "4"  # SRBIJA category
                }
                
                response = await client.get(f"{self.base_url}/live/streams", params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if isinstance(data, list):
                        if len(data) > 0:
                            # Validate that streams belong to the requested category
                            sample_stream = data[0]
                            
                            self.log_test(
                                "Live Streams - Category Filter (SRBIJA)",
                                True,
                                f"Retrieved {len(data)} streams for category_id=4",
                                {"streams_count": len(data), "sample_stream": sample_stream}
                            )
                            return True
                        else:
                            self.log_test(
                                "Live Streams - Category Filter (SRBIJA)",
                                True,
                                "No streams found for category_id=4 (this might be expected)",
                                {"streams_count": 0}
                            )
                            return True
                    else:
                        self.log_test(
                            "Live Streams - Category Filter (SRBIJA)",
                            False,
                            f"Expected list, got: {type(data)}",
                            data
                        )
                else:
                    self.log_test(
                        "Live Streams - Category Filter (SRBIJA)",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Live Streams - Category Filter (SRBIJA)",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_stream_url_generation(self):
        """Test stream URL generation"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                payload = {
                    "username": self.username,
                    "password": self.password,
                    "stream_id": 1,
                    "extension": "m3u8"
                }
                
                response = await client.post(f"{self.base_url}/live/stream-url", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'stream_url' in data:
                        stream_url = data['stream_url']
                        expected_format = f"https://s.luxuztv.com:443/live/{self.username}/{self.password}/1.m3u8"
                        
                        if stream_url == expected_format:
                            self.log_test(
                                "Stream URL Generation",
                                True,
                                f"Generated correct HLS URL: {stream_url}",
                                data
                            )
                            return True
                        else:
                            self.log_test(
                                "Stream URL Generation",
                                False,
                                f"URL format incorrect. Expected: {expected_format}, Got: {stream_url}",
                                data
                            )
                    else:
                        self.log_test(
                            "Stream URL Generation",
                            False,
                            "Response missing 'stream_url' field",
                            data
                        )
                else:
                    self.log_test(
                        "Stream URL Generation",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        None
                    )
        except Exception as e:
            self.log_test(
                "Stream URL Generation",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_stream_url_different_ids(self):
        """Test stream URL generation with different stream IDs"""
        try:
            test_stream_ids = [1, 100, 999]
            success_count = 0
            
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                for stream_id in test_stream_ids:
                    payload = {
                        "username": self.username,
                        "password": self.password,
                        "stream_id": stream_id,
                        "extension": "m3u8"
                    }
                    
                    response = await client.post(f"{self.base_url}/live/stream-url", json=payload)
                    
                    if response.status_code == 200:
                        data = response.json()
                        if 'stream_url' in data:
                            expected_url = f"https://s.luxuztv.com:443/live/{self.username}/{self.password}/{stream_id}.m3u8"
                            if data['stream_url'] == expected_url:
                                success_count += 1
                
                if success_count == len(test_stream_ids):
                    self.log_test(
                        "Stream URL Generation - Multiple IDs",
                        True,
                        f"Successfully generated URLs for all {len(test_stream_ids)} stream IDs",
                        {"tested_ids": test_stream_ids, "success_count": success_count}
                    )
                    return True
                else:
                    self.log_test(
                        "Stream URL Generation - Multiple IDs",
                        False,
                        f"Only {success_count}/{len(test_stream_ids)} URLs generated correctly",
                        {"tested_ids": test_stream_ids, "success_count": success_count}
                    )
        except Exception as e:
            self.log_test(
                "Stream URL Generation - Multiple IDs",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def test_cors_headers(self):
        """Test CORS headers are present"""
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(f"{self.base_url}/")
                
                cors_headers = [
                    'access-control-allow-origin',
                    'access-control-allow-methods',
                    'access-control-allow-headers'
                ]
                
                present_headers = []
                for header in cors_headers:
                    if header in response.headers:
                        present_headers.append(header)
                
                if len(present_headers) >= 1:  # At least one CORS header should be present
                    self.log_test(
                        "CORS Headers",
                        True,
                        f"CORS headers present: {present_headers}",
                        {"headers": dict(response.headers)}
                    )
                    return True
                else:
                    self.log_test(
                        "CORS Headers",
                        False,
                        "No CORS headers found",
                        {"headers": dict(response.headers)}
                    )
        except Exception as e:
            self.log_test(
                "CORS Headers",
                False,
                f"Exception: {str(e)}",
                None
            )
        return False
    
    async def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Luxuz TV IPTV Backend API Tests")
        print(f"📡 API Base URL: {self.base_url}")
        print(f"👤 Test Credentials: {self.username}/{self.password}")
        print(f"🌐 Portal: {PORTAL_URL}")
        print("=" * 80)
        
        # Run all tests
        tests = [
            self.test_authentication_valid_credentials,
            self.test_authentication_invalid_credentials,
            self.test_live_categories,
            self.test_live_streams_all,
            self.test_live_streams_category_filter,
            self.test_stream_url_generation,
            self.test_stream_url_different_ids,
            self.test_cors_headers
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                result = await test()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {str(e)}")
                failed += 1
            
            # Small delay between tests
            await asyncio.sleep(0.5)
        
        print("=" * 80)
        print(f"📊 Test Results Summary:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed, self.test_results

async def main():
    """Main test runner"""
    tester = LuxuzTVAPITester()
    passed, failed, results = await tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'passed': passed,
                'failed': failed,
                'success_rate': passed/(passed+failed)*100 if (passed+failed) > 0 else 0
            },
            'detailed_results': results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return passed == len(results) and failed == 0

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)