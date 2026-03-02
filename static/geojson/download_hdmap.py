#!/usr/bin/env python3
'''
Author: Trunk Simulation Team
Date: 2023-04-03 18:39:57
Description:
Copyright (c) 2023 by Trunk Inc, All Rights Reserved.
'''

import argparse
import json
import os
import requests

print("=================== begin =====================")

parser = argparse.ArgumentParser(add_help=False)

parser.add_argument('--version', '-v', action='version',
                    version='%(prog)s version : v0.01', help='show the version')
parser.add_argument('--help', '-h', action='help', help='Show this help message and exit')
parser.add_argument('--download_file_path', type=str, default=".", help="下载文件所在路径，默认当前路径")
parser.add_argument('--new_version_only', type=bool, default=True, help="下载地图的全部版本，还是最新版本，默认下载全部版本")
parser.add_argument('--frontend_or_backend', type=str, default="frontend", help="下载前端地图还是后端地图，默认下载前端地图")
parser.add_argument('--type', type=str, default="gps", help="下载的地图类型")

args = parser.parse_args()
print(args)

url = "http://10.11.1.51:9960/"
list_url = url + "hdmap/hdmap_list/"
response = requests.get(list_url)

if response.status_code == 200:
    data = response.json()
else:
    print("Request failed with status code:", response.status_code)
    exit(1)

summary = []
for element in data['data']['map_list']:
    element_real = []
    if args.new_version_only:
        element_real = [data['data'][element]['version_list'][0]]
    else:
        element_real = data['data'][element]['version_list']
    for version in element_real:
        map_info = dict()
        if len(args.type) == 0:
            map_name = element + '_v' + version + '.json'
            local_name = element + '.json'
            local_key = element
        else:
            map_name = element + '_' + args.type + '_v' + version + '.json'
            local_name = element + '_' + args.type + '.json'
            local_key = element + '_' + args.type
        down_file_url = url + data['data'][element]["path"] + 'v_' + version + '/' + map_name
        local_file_path = args.download_file_path + '/' + local_name
        print(f'start download file: {local_name}')
        print(f'from: {down_file_url} to {local_file_path}')

        r = requests.get(down_file_url, stream=True)

        # 检查响应状态码，404 时跳过
        if r.status_code == 404:
            print(f'[跳过] 文件不存在 (404): {local_name}')
            continue

        if r.status_code != 200:
            print(f'[错误] 下载失败 (状态码 {r.status_code}): {local_name}')
            continue

        # 下载成功，写入文件
        with open(local_file_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        map_info['name'] = local_key
        map_info['path'] = data['data'][element]["path"] + 'v_' + version + '/'
        summary.append(map_info)
        print(f'[完成] 下载成功: {local_name}')

if len(summary) > 0:
    with open(args.download_file_path + '/map_config.json', 'w') as f:
        json.dump(summary, f, indent=4)

# 清理不在配置中的多余 JSON 文件
valid_files = {item['name'] + '.json' for item in summary}
valid_files.add('map_config.json')  # 保留配置文件本身

for filename in os.listdir(args.download_file_path):
    if filename.endswith('.json') and filename not in valid_files:
        filepath = os.path.join(args.download_file_path, filename)
        os.remove(filepath)
        print(f'[清理] 删除多余文件: {filename}')

print("=================== end =====================")
