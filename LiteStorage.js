/*LiteStorage.js 轻量型本地缓存能力，作者CH*/
db=(function(){
	"use strict";
	var d1,d2,d3;
	var db;//当前正在使用的数据库对象
	var db1={
		connect:function(ok){//第一次连接,如果无法使用将降级
			if(!'indexedDB' in window){
				db2.connect(ok);
				return;
			}
			db=this;
			d1=indexedDB.open("chdb");
			d1.onupgradeneeded = function(e) {
				d1.result.createObjectStore("kv");
			};
			d1.onerror = function(e){
				e.preventDefault();
			};
			d1.onsuccess = function(e){
				db1.db=e.target.result;
				db1.setItem("hello","world",function(){
					db1.getItem("hello",function(v){
						if(v=="world")
							ok(db1.db);
						else
							db2.connect(ok);//校验不通过，降级
					})
				})
				
			};
		},setItem:function(k,v,fn){
			var s=this.db.transaction('kv','readwrite').objectStore('kv');
			var r=s.put(v,k);
			if(!fn)return;
			r.onsuccess = function(){
				fn(v);
			};
			r.onerror = function(){
				fn();
			};
		},getItem:function(k,fn){
			if(!fn)return;
			var s=this.db.transaction('kv','readonly').objectStore('kv');
			var r=s.get(k);
			r.onsuccess = function(){
				var v = r.result;
				if(v === void 0)v = null;
				fn(v);
			};
			r.onerror = function(){
				fn();
			};
		},removeItem:function(k,fn){
			var t=this.db.transaction('kv','readwrite');
			var s=t.objectStore('kv');
			var r=s.delete(k);
			t.oncomplete = function(){
				fn(null);
			};
			t.onerror=t.onabort=function(){
				fn();
			};
		},iterate:function(iterator,callback){
			var s=this.db.transaction('kv','readonly').objectStore('kv');
			var r = s.openCursor();
			r.onsuccess = function () {
				var c = r.result;
				if (c) {
					var k=c.key;
					var v = c.value;
					if(iterator(k,v)===void 0)c.continue();else if(callback)callback(null);
				}else
					if(callback)callback(null);
				
			}
			r.onerror = function () {
				if(callback)callback();
			};
		},clear:function(fn){
			var s=this.db.transaction('kv','readwrite').objectStore('kv');
			var r = s.clear();
			if(!fn)return;
			r.onsuccess = function(){
				fn(null);
			}
			r.onerror=r.onabort=function(){
				fn();
			};
		}
	};//indexedDB对象
	
	var db2={
		connect:function(ok){
			if(!'openDatabase' in window){
				db3.connect(ok);
				return;
			}
			db=this;
			this.db=openDatabase("chdb","","chWebOS",4980736);
			this.db.transaction(function(t) {
				t.executeSql('CREATE TABLE IF NOT EXISTS chdb (id INTEGER PRIMARY KEY, key unique, value)', [], function(){
					db2.setItem("hello","world",function(){
						db2.getItem("hello",function(v){
							if(v=="world")
								ok(db1.db);
							else db2.connect(ok);//校验不通过，降级
						})
					})
				},function(){
					db.connect(ok);
					return;
				});
			});
			
		},setItem:function(k,v,fn){
			this.db.transaction(function(t){
				t.executeSql('INSERT OR REPLACE INTO chdb (key, value) VALUES (?, ?)', [k, JSON.stringify(v)], function () {
					if(fn)fn(v);
				},function(){
					if(fn)fn();
				});
			});
		},getItem:function(k,fn){
			if(!fn)return;
			this.db.transaction(function(t){
				t.executeSql('SELECT * FROM chdb WHERE key = ? LIMIT 1', [k], function (t, r) {
					fn(r.rows.length ? JSON.parse(r.rows.item(0).value) : null);
				},function(){
					fn();
				});
			});
		},removeItem:function(k,fn){
			this.db.transaction(function(t){
				t.executeSql('DELETE FROM chdb WHERE key = ?', [k], function () {
					if(fn)fn(null);
				},function(){
					if(fn)fn();
				});
			});
		},iterate:function(iterator,callback){
			this.db.transaction(function(t){
				t.executeSql('SELECT * FROM chdb', [], function(t, r) {
					var rows = r.rows;
					var length = rows.length;
					for (var i = 0; i < length; i++) {
						var item = rows.item(i);
						if (iterator(item.key,JSON.parse(item.value)) !== void 0) {
							if(callback)callback(null);
							return;
						}
					}
					if(callback)callback(null);
				});
			});
		},clear:function(fn){
			this.db.transaction(function(t){
				t.executeSql('DELETE FROM chdb', [], function() {
					if(fn)fn(null);
				},function(){
					if(fn)fn();
				});
			});
		}
	};//WebSQL对象
	var db3={
		connect:function(ok){
			if(!'localStorage' in window){
				//基本不可能发生的，除了浏览器的极端情况
				console.warn("浏览器不支持本地储存！");
				return;
			}
			db=this;
			console.warn("浏览器正在使用localStorage存储！");
			this.db=localStorage;
			ok(this.db);//不校验了，因为没法降级了
		},setItem:function(k,v,fn){
			this.db.setItem(k,JSON.stringify(v));
			if(fn)fn(v);
		},getItem:function(k,fn){
			if(!fn)return;
			fn(JSON.parse(this.db.getItem(k)));
		},removeItem:function(k,fn){
			this.db.removeItem(k);
			fn(null);
		},iterate:function(iterator,callback){
			for (var i = 0; i < this.db.length; i++) {
				var k = this.db.key(i);
				if (iterator(k,this.db.getItem(k)) !== void 0){
					if(callback)callback(null);
					return;
				}
			}
			if(callback)callback(null);
		},clear:function(fn){
			for(var i = this.db.length-1;i>=0;i--)this.db.removeItem(this.db.key(i));
			fn(null);
		}
	};//LocalStorage对象
	db=db1;
	return {//exports
		setItem:function(k,v,fn){
			if(db.db)
				db.setItem(k,v,fn);
			else
				db.connect(function(){
					db.setItem(k,v,fn);
				});
		},getItem:function(k,fn){
			if(db.db)
				db.getItem(k,fn);
			else
				db.connect(function(){
					db.getItem(k,fn);
				});
		},removeItem:function(k,fn){
			if(db.db)
				db.removeItem(k,fn);
			else
				db.connect(function(){
					db.removeItem(k,fn);
				});
		},iterate:function(i,fn){
			if(db.db)
				db.iterate(i,fn);
			else
				db.connect(function(){
					db.iterate(i,fn);
				});
		},clear:function(fn){
			if(db.db)
				db.clear(fn);
			else
				db.connect(function(){
					db.clear(fn);
				});
		}
	};
})();
