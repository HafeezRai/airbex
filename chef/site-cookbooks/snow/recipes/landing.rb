include_recipe "snow::common"
include_recipe "apt"
include_recipe "nginx"

['git', 'make', 'g++', 'optipng', 'libjpeg-progs'].each do |pkg|
  package pkg do
  end
end

# Nginx configuration
template '/etc/nginx/sites-available/snow-landing' do
  source "landing/nginx.conf.erb"
  owner "root"
  group "root"
  notifies :reload, "service[nginx]"
end

# include_recipe 'deploy_wrapper'
bag = Chef::EncryptedDataBagItem.load("snow", 'main')
env_bag = bag[node.chef_environment]

ssh_known_hosts_entry 'github.com'

deploy_wrapper 'landing' do
    ssh_wrapper_dir '/home/ubuntu/landing-ssh-wrapper'
    ssh_key_dir '/home/ubuntu/.ssh'
    ssh_key_data bag["github_private_key"]
    owner "ubuntu"
    group "ubuntu"
    sloppy true
end

# Deployment config
deploy_revision node[:snow][:landing][:app_directory] do
    user "ubuntu"
    group "ubuntu"
    repo env_bag["repository"]["main"]
    branch node[:snow][:branch]
    ssh_wrapper "/home/ubuntu/landing-ssh-wrapper/landing_deploy_wrapper.sh"
    action :deploy
    before_symlink do
      bash "npm install" do
        user "root"
        group "root"
        cwd "#{release_path}/landing"
        code %{
          npm install
          PATH=$PATH:./node_modules/.bin
          export NODE_ENV=#{node.chef_environment}
          grunt
        }
      end
    end
    keep_releases 1
    symlinks({})
    symlink_before_migrate({})
    create_dirs_before_symlink([])
    purge_before_symlink([])
end

# Enable site
nginx_site 'snow-landing' do
  action :enable
end
