# 练习一：Nginx 容器与本地目录映射

## 项目说明

本练习通过运行 Nginx 容器，将宿主机目录挂载到容器内的 Nginx 静态资源目录，理解容器与宿主机的隔离、通信、目录映射和端口映射。

## 项目结构

```text
01_nginx_volume/
├── index.html
└── README.md
```

## 启动容器

在当前目录 `week07/practice/01_nginx_volume` 下执行：

```powershell
docker run -d --name nginx-volume-demo -p 8080:80 -v ${PWD}:/usr/share/nginx/html nginx:latest
```

参数说明：

- `-d`：后台运行容器
- `--name nginx-volume-demo`：指定容器名称
- `-p 8080:80`：将宿主机 `8080` 端口映射到容器 `80` 端口
- `-v ${PWD}:/usr/share/nginx/html`：将当前目录挂载到容器的 Nginx 静态页面目录
- `nginx:latest`：使用官方 Nginx 镜像

如果在 Windows CMD 中执行，可使用：

```cmd
docker run -d --name nginx-volume-demo -p 8080:80 -v %cd%:/usr/share/nginx/html nginx:latest
```

## 验证

浏览器访问：

```text
http://localhost:8080
```

应该能看到 `index.html` 中的页面内容。

## 验证 Volume 实时更新

修改宿主机上的 `index.html`，保存后刷新浏览器，即可立即看到内容变化，无需重启容器。

## 停止并删除容器

```powershell
docker stop nginx-volume-demo
docker rm nginx-volume-demo
```
