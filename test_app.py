#!/usr/bin/env python3
"""
测试基因序列比对工具的功能
"""

import requests
import json
import time

def test_app():
    """测试应用功能"""
    base_url = "http://localhost:5000"
    
    print("🧪 开始测试基因序列比对工具...")
    print("=" * 50)
    
    # 测试1: 检查应用是否运行
    try:
        response = requests.get(base_url, timeout=5)
        if response.status_code == 200:
            print("✅ 应用运行正常")
        else:
            print(f"❌ 应用响应异常: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ 无法连接到应用: {e}")
        return False
    
    # 测试2: 测试示例数据
    try:
        response = requests.get(f"{base_url}/sample_data/seq1.fasta", timeout=5)
        if response.status_code == 200:
            print("✅ 示例数据1加载正常")
        else:
            print(f"❌ 示例数据1加载失败: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 示例数据1加载异常: {e}")
    
    try:
        response = requests.get(f"{base_url}/sample_data/seq2.fasta", timeout=5)
        if response.status_code == 200:
            print("✅ 示例数据2加载正常")
        else:
            print(f"❌ 示例数据2加载失败: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 示例数据2加载异常: {e}")
    
    # 测试3: 测试序列比对功能
    print("\n🔬 测试序列比对功能...")
    
    # 准备测试数据
    test_seq1 = "ATCGATCGATCG"
    test_seq2 = "ATCGATCGATCC"  # 最后一个字符不同
    
    data = {
        'seq1_text': test_seq1,
        'seq2_text': test_seq2
    }
    
    try:
        response = requests.post(f"{base_url}/compare", data=data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ 序列比对功能正常")
                print(f"   相似度: {result.get('similarity', 'N/A')}%")
                print(f"   差异数: {result.get('differences', 'N/A')}")
            else:
                print(f"❌ 序列比对失败: {result.get('error', '未知错误')}")
        else:
            print(f"❌ 序列比对请求失败: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ 序列比对请求异常: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 测试完成！")
    print(f"📱 请在浏览器中访问: {base_url}")
    print("💡 提示: 可以使用示例数据进行测试")
    
    return True

if __name__ == "__main__":
    test_app() 