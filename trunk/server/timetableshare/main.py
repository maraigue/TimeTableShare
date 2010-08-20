#!/usr/bin/env python

import cgi
import json

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db

# ---------- DB定義 ----------

class TTSUser(db.Model):
  id = db.IntegerProperty()
  user = db.UserProperty()
  administrate = db.ListProperty(db.Key) # そのユーザがユーザを追加・削除することが可能な時刻表
  edit = db.ListProperty(db.Key) # そのユーザが編集することが可能な時刻表
  view = db.ListProperty(db.Key) # そのユーザが閲覧することが可能な時刻表

class TimeTable(db.Model):
  oldid = db.ListProperty(db.Key) # 古い版の情報。最新版以外はこの値は空の配列となる
  administrators = db.ListProperty(db.Key) # ユーザの追加・削除が可能なユーザ
  editors = db.ListProperty(db.Key) # 編集が可能なユーザ
  viewers = db.ListProperty(db.Key) # 閲覧が可能なユーザ
  viewed_by_everyone = db.BooleanProperty() # その時刻表を誰でも見られるか（デフォルト：false）
  edited_by_everyone = db.BooleanProperty() # その時刻表を誰でも編集できるか（デフォルト：false）
  stations = db.TextProperty() # 駅名一覧を格納したJSON文字列
  trains = db.TextProperty()   # 列車名一覧を格納したJSON文字列
  times = db.TextProperty()    # 列車時刻一覧を格納したJSON文字列

# ---------- 処理 ----------

class MainPage(webapp.RequestHandler):
  def get(self):
    user = users.get_current_user()
    
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write("""
<html>
<head>
<title>トップページ - TimeTableShare</title>
<meta http-equiv="content-type" content="text/html;charset=utf-8" />
</head>
<body>
<h1>TimeTableShare</h1>
<p>Web上で時刻表を管理しよう！</p>
<p><a href="index/">ログインする</a></p>
</body>
</html>
    """)

class IndexPage(webapp.RequestHandler):
  def get(self):
    pass
    #user = users.get_current_user()
    #
    #if user:
    #   ログイン済みの場合は、すでにそのユーザ情報が格納されているかを確認する
    #  query = db.GqlQuery("SELECT * FROM TTSUser WHERE user = :1", user)
    #  info = query.fetch(limit=1)
    #  
    #  if len(info) == 0:
    #    self.response.headers['Content-Type'] = 'text/html'
    #    self.response.out.write("""
    #      そのユーザは登録されてません。これから登録します。
    #    """
    #  else:
    #    self.redirect("/user/"+info[0].id)
    #  
    #  self.response.headers['Content-Type'] = 'text/html'
    #  self.response.out.write("""
    #    そのユーザは登録されてません。これから登録します。
    #  """
    #else:
    #  # ログインされていない場合は、ログインさせる
    #  self.redirect(users.create_login_url(self.request.uri))

class LoginPage(webapp.RequestHandler):
  def post(self):
    # これから書く
    pass

class UserPage(webapp.RequestHandler):
  def get(self):
    self.response.headers['Content-Type'] = 'text/html'
    self.response.out.write("""
ようこそ！
    """

class EditPage(webapp.RequestHandler):
  def get(self):
    # これから書く
    pass

class UploadPage(webapp.RequestHandler):
  def post(self):
    # これから書く
    pass

application = webapp.WSGIApplication([
    # routing
    ('/', MainPage),
    ('/index', IndexPage),
    ('/login', LoginPage),
    ('/user', UserPage),
    ('/edit', EditPage),
    ('/upload', UploadPage),
  ],
  debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
