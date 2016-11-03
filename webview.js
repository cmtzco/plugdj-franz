module.exports = (Franz, options) => {
	/**
 * @author  JTBrinkmann
 * @author  Chikachi
 * @author  Colgate
 * @author  ReAnna
 * @author  Thedark1337
 *
 * @version 4.3.0.48+release
 *
 * @license Copyright © 2012-2016 The plug³ Team and other contributors
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

/**
 * Loader File adapted from ReAnna's ExtPlug
 */

;
(function loading() {
    if (!(~window.location.hostname.indexOf('plug.dj'))) return alert('Loading plug³ outside of plug.dj is not supported.');

    // Fixes some analytics issues when using tracking / ad blockers
    window.Intercom = window.Intercom || {};
    window.amplitude = window.amplitude || { __VERSION__: 1337 };

    if (isLoaded()) {

        var requirejs = window.requirejs;
        var require = window.require;
        var define = window.define;
        var plugCubed = window.plugCubed;

        if (typeof plugCubed !== 'undefined') {
            plugCubed.close();
        }

        /**
 Simple JavaScript Inheritance
 By John Resig http://ejohn.org/
 MIT Licensed.

 Modified by Plug DJ, Inc.
 */
        define('plugCubed/Class', [], function() {
            /* eslint-disable */

            var e, t, n;

            e = false;
            t = /xyz/.test(function() {
                xyz;
            }) ? /\b_super\b/ : /.*/;
            n = function() {};
            n.extend = function(n) {
                var r = this.prototype;

                e = true;
                var i = new this();

                e = false;

                for (var s in n) {
                    if (!n.hasOwnProperty(s)) continue;
                    if (typeof n[s] == 'function' && typeof r[s] == 'function' && t.test(n[s])) {
                        i[s] = function(e, t) {
                            return function() {
                                var n = this._super;

                                this._super = r[e];
                                var i = t.apply(this, arguments);

                                this._super = n;
                                return i;
                            };
                        }(s, n[s]);
                    } else {
                        i[s] = n[s];
                    }
                }

                function Class() {
                    if (!e && this.init) {
                        this.init.apply(this, arguments);
                    }
                }

                Class.prototype = i;
                Class.prototype.constructor = Class;
                Class.extend = arguments.callee;
                return Class;
            };
            return n;
        });

        define('plugCubed/handlers/TriggerHandler', ['jquery', 'plugCubed/Class'], function($, Class) {
            return Class.extend({
                triggerHandlers: [],
                trigger: undefined,
                registered: false,
                init: function() {
                    var i;

                    if (this.triggerHandlers.length > 0) {
                        this.close();
                    }
                    this.triggerHandlers = [];
                    if (this.trigger == null) {
                        throw new Error('Missing TriggerHandler trigger!');
                    }
                    if (typeof this.trigger === 'string') {
                        this.triggerHandlers[this.trigger] = this.handler;
                    } else if (_.isArray(this.trigger)) {
                        for (i = 0; i < this.trigger.length; i++) {
                            if (!this.trigger[i]) continue;
                            if (typeof this[this.trigger[i]] === 'function') {
                                this.triggerHandlers[this.trigger[i]] = this[this.trigger[i]];
                            } else {
                                this.triggerHandlers[this.trigger[i]] = this.handler;
                            }
                        }
                    } else if ($.isPlainObject(this.trigger)) {
                        for (i in this.trigger) {
                            if (!this.trigger.hasOwnProperty(i)) continue;
                            this.triggerHandlers[i] = this.trigger[i];
                        }
                    }
                },
                register: function() {
                    var i;

                    for (i in this.triggerHandlers) {
                        if (!this.triggerHandlers.hasOwnProperty(i)) continue;
                        if (typeof this.triggerHandlers[i] === 'function') {
                            API.on(i, this.triggerHandlers[i], this);
                        } else if (typeof this[this.triggerHandlers[i]] === 'function') {
                            API.on(i, this[this.triggerHandlers[i]], this);
                        }
                    }
                    this.registered = true;
                },
                close: function() {
                    var i;

                    for (i in this.triggerHandlers) {
                        if (!this.triggerHandlers.hasOwnProperty(i)) continue;
                        if (typeof this.triggerHandlers[i] === 'function') {
                            API.off(i, this.triggerHandlers[i], this);
                            delete this.triggerHandlers[i];
                        } else if (typeof this[this.triggerHandlers[i]] === 'function') {
                            API.off(i, this[this.triggerHandlers[i]], this);
                            delete this[this.triggerHandlers[i]];
                        }
                    }
                    this.registered = false;
                }
            });
        });

        define('plugCubed/Version', [], function() {
            return {
                major: 4,
                minor: 3,
                patch: 0,
                prerelease: '',
                build: 48,
                minified: false,
                getSemver: function() {
                    return this.major + '.' + this.minor + '.' + this.patch + '.' + this.build + (this.prerelease != null && this.prerelease !== '' ? '+' + this.prerelease : '') + (this.minified ? '_min' : '');
                },
                toString: function() {
                    return this.major + '.' + this.minor + '.' + this.patch + (this.prerelease != null && this.prerelease !== '' ? '-' + this.prerelease : '') + (this.minified ? '_min' : '') + ' (Build ' + this.build + ')';
                }
            };
        });

        define('plugCubed/Lang', ['jquery', 'plugCubed/Class', 'plugCubed/Version'], function($, Class, Version) {
            var language, defaultLanguage, that, Lang;

            language = defaultLanguage = {};

            Lang = Class.extend({
                curLang: 'en',
                defaultLoaded: false,
                loaded: false,
                init: function() {
                    that = this;
                    $.getJSON('https://plugcubed.net/scripts/release/lang.json?v=' + Version.getSemver(), function(a) {
                        that.allLangs = a;
                    }).done(function() {
                        if (that.allLangs.length === 1) API.chatLog('Error loading language info for plug³');
                        that.loadDefault();
                    }).fail(function() {
                        API.chatLog('Error loading language info for plug³');
                        that.loadDefault();
                    });
                },

                /**
                 * Load default language (English) from server.
                 */
                loadDefault: function() {
                    $.getJSON('https://plugcubed.net/scripts/release/langs/lang.en.json?v=' + Version.getSemver(), function(languageData) {
                        defaultLanguage = languageData;
                        that.defaultLoaded = true;
                    }).error(function() {
                        setTimeout(function() {
                            that.loadDefault();
                        }, 500);
                    });
                },

                /**
                 * Load language file from server.
                 * @param {Function} [callback] Optional callback that will be called on success and failure.
                 */
                load: function(callback) {
                    if (!this.defaultLoaded) {
                        setTimeout(function() {
                            that.load(callback);
                        }, 500);

                        return;
                    }
                    var lang = API.getUser().language;

                    if (!lang || lang === 'en' || this.allLangs.indexOf(lang) < 0) {
                        language = {};
                        _.extend(language, defaultLanguage);
                        this.curLang = 'en';
                        this.loaded = true;
                        if (typeof callback === 'function') {
                            callback();

                            return;
                        }

                        return;
                    }
                    $.getJSON('https://plugcubed.net/scripts/release/langs/lang.' + lang + '.json?v=' + Version.major + '.' + Version.getSemver(), function(languageData) {
                        language = {};
                        _.extend(language, defaultLanguage, languageData);
                        that.curLang = lang;
                        that.loaded = true;
                        if (typeof callback === 'function') {
                            callback();

                            return;
                        }
                    }).error(function() {
                        console.log('[plug³ Lang] Couldn\'t load language file for ' + lang);
                        language = {};
                        _.extend(language, defaultLanguage);
                        that.curLang = 'en';
                        that.loaded = true;
                        if (typeof callback === 'function') {
                            callback();

                            return;
                        }
                    });
                },

                /**
                 * Get string from language file.
                 * @param {String} selector Selector key
                 * @returns {*} String from language file, if not found returns selector and additional arguments.
                 */
                i18n: function(selector) {
                    var a = language;
                    var i;

                    if (a == null || selector == null) {
                        return '{' + _.toArray(arguments).join(', ') + '}';
                    }
                    var key = selector.split('.');

                    for (i in key) {
                        if (!key.hasOwnProperty(i)) continue;
                        if (a[key[i]] == null) {
                            return '{' + _.toArray(arguments).join(', ') + '}';
                        }
                        a = a[key[i]];
                    }
                    if (arguments.length > 1) {
                        for (i = 1; i < arguments.length; i++) {
                            a = a.split('%' + i).join(arguments[i]);
                        }
                    }

                    return a;
                },
                allLangs: [{
                    file: 'en',
                    name: 'English'
                }]
            });

            return new Lang();
        });

        /**
         * Thank you to Brinkie Pie https://github.com/jtbrinkmann
         **/

        define('plugCubed/ModuleLoader', ['plugCubed/Class'], function(Class) {

            var modules = require.s.contexts._.defined;
            var ref1, ref2, ref3, cb, ev, i;
            var ModuleLoader = Class.extend({
                init: function(a) {
                    if (typeof window.plugCubedModules === 'undefined') {
                        window.plugCubedModules = {};
                    }
                    for (var id in modules) {
                        if (!modules.hasOwnProperty(id)) continue;

                        var m = modules[id];

                        if (m) {
                            var moduleName = false;

                            if (!('requireID' in m)) {
                                m.requireID = id;
                            }
                            switch (false) {
                                case !m.MASTER:
                                    moduleName = 'RandomUtil';
                                    break;
                                case !m.ACTIVATE:
                                    moduleName = 'ActivateEvent';
                                    break;
                                case m._name !== 'MediaGrabEvent':
                                    moduleName = 'MediaGrabEvent';
                                    break;
                                case m._name !== 'AlertEvent':
                                    moduleName = 'AlertEvent';
                                    break;
                                case !m.deserializeMedia:
                                    moduleName = 'auxiliaries';
                                    break;
                                case !m.AUDIENCE:
                                    moduleName = 'Avatar';
                                    break;
                                case !m.getAvatarUrl:
                                    moduleName = 'avatarAuxiliaries';
                                    break;
                                case !m.Events:
                                    moduleName = 'backbone';
                                    break;
                                case !m.mutes:
                                    moduleName = 'chatAuxiliaries';
                                    break;
                                case !m.updateElapsedBind:
                                    moduleName = 'currentMedia';
                                    break;
                                case !m.settings:
                                    moduleName = 'database';
                                    break;
                                case !m.emojiMap:
                                    moduleName = 'emoji';
                                    break;
                                case !m.mapEvent:
                                    moduleName = 'eventMap';
                                    break;
                                case !m.getSize:
                                    moduleName = 'Layout';
                                    break;
                                case !m.compress:
                                    moduleName = 'LZString';
                                    break;
                                case !m._read:
                                    moduleName = 'playlistCache';
                                    break;
                                case !m.activeMedia:
                                    moduleName = 'playlists';
                                    break;
                                case !m.scThumbnail:
                                    moduleName = 'plugUrls';
                                    break;
                                case m.className !== 'pop-menu':
                                    moduleName = 'popMenu';
                                    break;
                                case m._name !== 'RoomEvent':
                                    moduleName = 'RoomEvent';
                                    break;
                                case !(m.comparator && m.comparator === 'username'):
                                    moduleName = 'ignoreCollection';
                                    break;
                                case !(m.comparator && m.exists):
                                    moduleName = 'roomHistory';
                                    break;
                                case !m.onVideoResize:
                                    moduleName = 'roomLoader';
                                    break;
                                case !m.ytSearch:
                                    moduleName = 'searchAux';
                                    break;
                                case !m._search:
                                    moduleName = 'searchManager';
                                    break;
                                case m.SHOW !== 'ShowDialogEvent:show':
                                    moduleName = 'ShowDialogEvent';
                                    break;
                                case !m.ack:
                                    moduleName = 'socketEvents';
                                    break;
                                case !m.sc:
                                    moduleName = 'soundcloud';
                                    break;
                                case !m.identify:
                                    moduleName = 'tracker';
                                    break;
                                case !m.canModChat:
                                    moduleName = 'CurrentUser';
                                    break;
                                case !m.onRole:
                                    moduleName = 'users';
                                    break;
                                case !m.PREVIEW:
                                    moduleName = 'PreviewEvent';
                                    break;
                                case !('_window' in m):
                                    moduleName = 'PopoutView';
                                    break;
                                default:
                                    switch (m.id) {
                                        case 'playlist-menu':
                                            moduleName = 'playlistMenu';
                                            break;
                                        case 'user-lists':
                                            moduleName = 'userList';
                                            break;
                                        case 'user-rollover':
                                            moduleName = 'userRollover';
                                            break;
                                        case 'audience':
                                            moduleName = 'audienceRenderer';
                                            break;
                                        default:
                                            switch (false) {
                                                case !((ref1 = m._events) != null && ref1['chat:receive']):
                                                    moduleName = 'context';
                                                    break;
                                                case !m.attributes:
                                                    switch (false) {
                                                        case !('shouldCycle' in m.attributes):
                                                            moduleName = 'booth';
                                                            break;
                                                        case !('hostID' in m.attributes):
                                                            moduleName = 'room';
                                                            break;
                                                        case !('grabbers' in m.attributes):
                                                            moduleName = 'votes';
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                    break;
                                                case !m.prototype:
                                                    switch (false) {
                                                        case m.prototype.id !== 'user-inventory':
                                                            moduleName = 'userInventory';
                                                            break;
                                                        case m.prototype.className !== 'friends':
                                                            moduleName = 'FriendsList';
                                                            break;
                                                        case !(m.prototype.className === 'avatars' && m.prototype.eventName):
                                                            moduleName = 'InventoryAvatarPage';
                                                            break;
                                                        case !(m.prototype.template === require('hbs!templates/user/inventory/TabMenu')):
                                                            moduleName = 'TabMenu';
                                                            break;
                                                        case !(m.prototype.className === 'list room'):
                                                            moduleName = 'RoomUsersListView';
                                                            break;
                                                        case !(m.prototype.className === 'cell' && m.prototype.getBlinkFrame):
                                                            moduleName = 'AvatarCell';
                                                            break;
                                                        case !m.prototype.scrollToBottom:
                                                            moduleName = 'PopoutChat';
                                                            break;
                                                        case !m.prototype.onFromClick:
                                                            moduleName = 'Chat';
                                                            break;
                                                        case m.prototype.id !== 'dialog-alert':
                                                            moduleName = 'DialogAlert';
                                                            break;
                                                        case !(m.prototype.defaults && 'title' in m.prototype.defaults && 'duration' in m.prototype.defaults):
                                                            moduleName = 'Media';
                                                            break;
                                                        case !m.prototype.onPlaylistVisible:
                                                            moduleName = 'MediaPanel';
                                                            break;
                                                        case m.prototype.id !== 'playback':
                                                            moduleName = 'Playback';
                                                            break;
                                                        case m.prototype.id !== 'volume':
                                                            moduleName = 'Volume';
                                                            break;
                                                        case m.prototype.id !== 'dialog-playlist-create':
                                                            moduleName = 'PlaylistCreateDialog';
                                                            break;
                                                        case m.prototype.listClass !== 'playlist-media':
                                                            moduleName = 'PlaylistItemList';
                                                            break;
                                                        case !m.prototype.onItemsChange:
                                                            moduleName = 'PlaylistListRow';
                                                            break;
                                                        case !m.prototype.hasOwnProperty('permissionAlert'):
                                                            moduleName = 'PlugAjax';
                                                            break;
                                                        case !m.prototype.vote:
                                                            moduleName = 'RoomUserRow';
                                                            break;
                                                        case !m.prototype.onQueryUpdate:
                                                            moduleName = 'SearchHeader';
                                                            break;
                                                        case m.prototype.listClass !== 'search':
                                                            moduleName = 'SearchList';
                                                            break;
                                                        case !(m.prototype.id === 'chat-suggestion' && m.__super__.id !== 'chat-suggestion'):
                                                            moduleName = 'SuggestionView';
                                                            break;
                                                        case !m.prototype.onAvatar:
                                                            moduleName = 'WaitlistRow';
                                                            break;
                                                        case !m.prototype.loadRelated:
                                                            moduleName = 'YtSearchService';
                                                            break;
                                                        default:
                                                            break;
                                                    }
                                                    break;
                                                default:
                                                    break;
                                            }
                                    }
                            }
                            if (moduleName) {
                                if (!window.plugCubed && window.plugCubedModules != null && window.plugCubedModules[moduleName] != null) {
                                    console.warn("[plug³ ModuleLoader] found multiple matches for '" + moduleName + "'");
                                }
                                window.plugCubedModules[moduleName] = m;
                            }
                        }
                    }
                    window.plugCubedModules.Lang = require('lang/Lang');
                    for (i = 0; i < (ref2 = window.plugCubedModules.room._events['change:name'] || window.plugCubedModules.context._events['show:room'] || window.plugCubedModules.Layout._events.resize || []).length; i++) {
                        cb = ref2[i];
                        if (cb.ctx.room) {
                            window.plugCubedModules.app = cb.ctx;
                            window.plugCubedModules.friendsList = window.plugCubedModules.app.room.friends;
                            window.plugCubedModules.search = window.plugCubedModules.app.footer.playlist.playlist.search;
                            window.plugCubedModules.pl = window.plugCubedModules.app.footer.playlist.playlist.media;
                            break;
                        }
                    }
                    if (window.plugCubedModules.app && !(window.plugCubedModules.chat = window.plugCubedModules.app.room.chat) && window.plugCubedModules.context) {
                        for (i = 0; i < (ref3 = window.plugCubedModules.context._events['chat:receive'] || []).length; i++) {
                            ev = ref3[i];

                            if (ref3.context && ref3.context.cid) {
                                window.plugCubedModules.chat = ev.context;
                                break;
                            }
                        }
                    }
                }

            });

            return new ModuleLoader();
        });

        define('plugCubed/Utils', ['plugCubed/Class', 'plugCubed/Lang', 'plugCubed/ModuleLoader'], function(Class, p3Lang) {
            var cleanHTMLMessage, Database, developer, sponsor, ambassador, donatorDiamond, donatorPlatinum, donatorGold, donatorSilver, donatorBronze, special, Lang, PlugUI, PopoutView;

            if (typeof window.plugCubedUserData === 'undefined') {
                window.plugCubedUserData = {};
            }
            var plugcubedUserData = window.plugCubedUserData;

            cleanHTMLMessage = function(input, disallow, extraAllow) {
                if (input == null) return '';
                var allowed, tags;
                var disallowed = [];

                if (_.isArray(disallow)) {
                    disallowed = disallow;
                }
                if (!extraAllow || !_.isArray(extraAllow)) {
                    extraAllow = [];
                }
                allowed = $(['span', 'div', 'table', 'tr', 'td', 'br', 'br/', 'strong', 'em', 'a'].concat(extraAllow)).not(disallowed).get();
                if (disallow === '*') {
                    allowed = [];
                }
                tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
                input = input.split('&#8237;').join('&amp;#8237;').split('&#8238;').join('&amp;#8238;');

                return input.replace(tags, function(a, b) {
                    return allowed.indexOf(b.toLowerCase()) > -1 ? a : '';
                });
            };
            Database = window.plugCubedModules.database;
            Lang = window.plugCubedModules.Lang;
            PopoutView = window.plugCubedModules.PopoutView;
            developer = sponsor = ambassador = donatorDiamond = donatorPlatinum = donatorGold = donatorSilver = donatorBronze = [];
            special = {};

            PlugUI = window.plugCubedModules.plugUrls;

            $.getJSON('https://plugcubed.net/scripts/titles.json',

                /**
                 * @param {{developer: Array, sponsor: Array, special: Array, ambassador: Array, donator: {diamond: Array, platinum: Array, gold: Array, silver: Array, bronze: Array}, patreon: {diamond: Array, platinum: Array, gold: Array, silver: Array, bronze: Array}}} data Object of User ID's for plug³ ranks.
                 */
                function(data) {
                    developer = data.developer ? data.developer : [];
                    sponsor = data.sponsor ? data.sponsor : [];
                    special = data.special ? data.special : {};
                    ambassador = data.ambassador ? data.ambassador : [];
                    if (data.donator) {
                        donatorDiamond = data.donator.diamond ? data.donator.diamond : [];
                        donatorPlatinum = data.donator.platinum ? data.donator.platinum : [];
                        donatorGold = data.donator.gold ? data.donator.gold : [];
                        donatorSilver = data.donator.silver ? data.donator.silver : [];
                        donatorBronze = data.donator.bronze ? data.donator.bronze : [];
                    }
                });

            var Handler = Class.extend({
                proxifyImage: function(url) {
                    if (this.startsWithIgnoreCase(url, 'http://')) {
                        return 'https://api.plugCubed.net/proxy/' + url;
                    }

                    return url;
                },
                httpsifyURL: function(url) {
                    if (this.startsWithIgnoreCase(url, 'http://')) {
                        return 'https://' + url.substr(7);
                    }

                    return url;
                },
                getHighestRank: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    if (this.isPlugCubedDeveloper(uid)) return 'developer';
                    if (this.isPlugCubedSponsor(uid)) return 'sponsor';
                    if (this.isPlugCubedSpecial(uid)) return 'special';
                    if (this.isPlugCubedAmbassador(uid)) return 'ambassador';
                    if (this.isPlugCubedDonatorDiamond(uid)) return 'donatorDiamond';
                    if (this.isPlugCubedDonatorPlatinum(uid)) return 'donatorPlatinum';
                    if (this.isPlugCubedDonatorGold(uid)) return 'donatorGold';
                    if (this.isPlugCubedDonatorSilver(uid)) return 'donatorSilver';
                    if (this.isPlugCubedDonatorBronze(uid)) return 'donatorBronze';

                    return null;
                },
                getHighestRankString: function(uid) {
                    var highestRank = this.getHighestRank(uid);

                    if (highestRank != null) {
                        if (this.isPlugCubedSpecial(uid)) {
                            return p3Lang.i18n('info.specialTitles.special', this.getPlugCubedSpecial(uid).title);
                        }

                        return p3Lang.i18n('info.specialTitles.' + highestRank);
                    }

                    return '';
                },
                havePlugCubedRank: function(uid) {
                    return this.isPlugCubedDeveloper(uid) || this.isPlugCubedSponsor(uid) || this.isPlugCubedSpecial(uid) || this.isPlugCubedAmbassador(uid) || this.isPlugCubedDonatorDiamond(uid) || this.isPlugCubedDonatorPlatinum(uid) || this.isPlugCubedDonatorGold(uid) || this.isPlugCubedDonatorSilver(uid) || this.isPlugCubedDonatorBronze(uid);
                },
                getAllPlugCubedRanks: function(uid, onlyP3) {
                    var ranks = [];

                    // plugCubed ranks
                    if (this.isPlugCubedDeveloper(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.developer'));
                    }
                    if (this.isPlugCubedSponsor(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.sponsor'));
                    }
                    if (this.isPlugCubedSpecial(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.special', this.getPlugCubedSpecial(uid).title));
                    }
                    if (this.isPlugCubedAmbassador(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.ambassador'));
                    }
                    if (this.isPlugCubedDonatorDiamond(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.donatorDiamond'));
                    }
                    if (this.isPlugCubedDonatorPlatinum(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.donatorPlatinum'));
                    }
                    if (this.isPlugCubedDonatorGold(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.donatorGold'));
                    }
                    if (this.isPlugCubedDonatorSilver(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.donatorSilver'));
                    }
                    if (this.isPlugCubedDonatorBronze(uid)) {
                        ranks.push(p3Lang.i18n('info.specialTitles.donatorBronze'));
                    }

                    // plug.dj ranks
                    if (!onlyP3) {
                        if (this.hasPermission(uid, 5, true)) {
                            ranks.push(Lang.roles.admin);
                        } else if (this.hasPermission(uid, 4, true)) {
                            ranks.push(Lang.roles.leader);
                        } else if (this.hasPermission(uid, 3, true)) {
                            ranks.push(Lang.roles.ambassador);
                        } else if (this.hasPermission(uid, 2, true)) {
                            ranks.push(Lang.roles.volunteer);
                        } else if (this.hasPermission(uid, API.ROLE.HOST)) {
                            ranks.push(Lang.roles.host);
                        } else if (this.hasPermission(uid, API.ROLE.COHOST)) {
                            ranks.push(Lang.roles.cohost);
                        } else if (this.hasPermission(uid, API.ROLE.MANAGER)) {
                            ranks.push(Lang.roles.manager);
                        } else if (this.hasPermission(uid, API.ROLE.BOUNCER)) {
                            ranks.push(Lang.roles.bouncer);
                        } else if (this.hasPermission(uid, API.ROLE.DJ)) {
                            ranks.push(Lang.roles.dj);
                        }
                    }

                    return ranks.join(' / ');
                },
                is24Hours: function() {
                    return $('.icon-timestamps-12').length === 1;
                },
                isPlugCubedDeveloper: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return developer.indexOf(uid) > -1;
                },
                isPlugCubedSponsor: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return sponsor.indexOf(uid) > -1;
                },
                isPlugCubedSpecial: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return this.getPlugCubedSpecial(uid) != null;
                },
                isPlugCubedAmbassador: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return ambassador.indexOf(uid) > -1;
                },
                isPlugCubedDonatorDiamond: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return donatorDiamond.indexOf(uid) > -1;
                },
                isPlugCubedDonatorPlatinum: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return donatorPlatinum.indexOf(uid) > -1;
                },
                isPlugCubedDonatorGold: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return donatorGold.indexOf(uid) > -1;
                },
                isPlugCubedDonatorSilver: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return donatorSilver.indexOf(uid) > -1;
                },
                isPlugCubedDonatorBronze: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return donatorBronze.indexOf(uid) > -1;
                },
                getPlugCubedSpecial: function(uid) {
                    if (!uid) {
                        uid = API.getUser().id;
                    }

                    return special[uid];
                },
                html2text: function(html) {
                    if (!html) return '';

                    return $('<div/>').html(html).text();
                },
                cleanHTML: function(msg, disallow, extraAllow) {
                    return cleanHTMLMessage(msg, disallow, extraAllow);
                },
                cleanTypedString: function(msg) {
                    return msg.split('<').join('&lt;').split('>').join('&gt;');
                },
                repeatString: function(str, count) {
                    count = +count;

                    if (!_.isFinite(count) || count < 0) throw new RangeError("Count can't be less than zero");

                    count = Math.floor(count);

                    if (str.length === 0 || count === 0) {
                        return '';
                    }

                    return Array(count + 1).join(str);
                },
                chatLog: function(type, message, color, fromID, fromName) {
                    var $chat, b, $message, $box, $msg, $text, $msgSpan, $timestamp, $from, fromUser, chat;

                    chat = window.plugCubedModules.chat;

                    if (!message) return;
                    if (typeof message !== 'string') {
                        message = message.html();
                    }

                    message = cleanHTMLMessage(message, undefined, ['ul', 'li']);
                    $msgSpan = $('<span>').html(message);
                    $chat = PopoutView._window ? $(PopoutView._window.document).find('#chat-messages') : $('#chat-messages');
                    b = $chat.scrollTop() > $chat[0].scrollHeight - $chat.height() - 20;

                    $message = $('<div>').addClass('message');
                    $box = $('<div>').addClass('badge-box').data('uid', fromID ? fromID : 'p3').data('type', type);
                    $timestamp = $('<span>').addClass('timestamp').text(this.getTimestamp());
                    $from = $('<div>').addClass('from').append($('<span>').addClass('un')).append($timestamp);
                    $msg = $('<div>').addClass('msg').append($from);
                    $text = $('<span>').addClass('text').append($msgSpan);

                    chat.lastText = chat.lastID = chat.lastType = chat.lastTime = null;

                    if ($('.icon-timestamps-off').length === 0) {
                        $timestamp.show();
                    }
                    $msgSpan.css('color', this.toRGB(color && this.isRGB(color) ? color : 'd1d1d1'));
                    $box.append('<i class="icon icon-plugcubed"></i>');

                    if (fromID) {
                        fromUser = API.getUser(fromID);
                        var lastMessageContainer = $('#chat-messages').find('.message').last();
                        var lastSender = lastMessageContainer.children('.badge-box').data('uid');
                        var lastType = lastMessageContainer.children('.badge-box').data('type');

                        if (fromUser != null && fromUser.username != null) {
                            if (lastSender === fromUser.id) {
                                lastMessageContainer.find('.text').append('<br>').append($msgSpan);
                                if ($chat.scrollTop() > $chat[0].scrollHeight - $chat.height() - lastMessageContainer.find('.text').height()) {
                                    $chat.scrollTop($chat[0].scrollHeight);
                                }

                                return;
                            }

                            $from.find('.un').html(cleanHTMLMessage(fromUser.username));

                            if (this.hasPermission(fromUser.id, API.ROLE.HOST, true)) {
                                $message.addClass('from-admin');
                                $from.addClass('admin').append('<i class="icon icon-chat-admin"></i>');
                            } else if (this.hasPermission(fromUser.id, API.ROLE.BOUNCER, true)) {
                                $message.addClass('from-ambassador');
                                $from.addClass('ambassador').append('<i class="icon icon-chat-ambassador"></i>');
                            } else if (this.hasPermission(fromUser.id, API.ROLE.BOUNCER)) {
                                $from.addClass('staff');
                                if (this.hasPermission(fromUser.id, API.ROLE.HOST)) {
                                    $message.addClass('from-host');
                                    $from.append('<i class="icon icon-chat-host"></i>');

                                } else if (this.hasPermission(fromUser.id, API.ROLE.COHOST)) {
                                    $message.addClass('from-cohost');
                                    $from.append('<i class="icon icon-chat-cohost"></i>');
                                } else if (this.hasPermission(fromUser.id, API.ROLE.MANAGER)) {
                                    $message.addClass('from-manager');
                                    $from.append('<i class="icon icon-chat-manager"></i>');
                                } else if (this.hasPermission(fromUser.id, API.ROLE.BOUNCER)) {
                                    $message.addClass('from-bouncer');
                                    $from.append('<i class="icon icon-chat-bouncer"></i>');
                                }
                            } else if (this.hasPermission(fromUser.id, API.ROLE.DJ)) {
                                $message.addClass('from-dj');
                                $from.addClass('dj').append('<i class="icon icon-chat-dj"></i>');
                            } else if (fromUser.id === API.getUser().id) {
                                $message.addClass('from-you');
                                $from.addClass('you');
                            }
                        } else if (fromID < 0) {
                            $from.find('.un').html('plug&#179;');
                            if (lastSender === fromID && type === lastType) {
                                lastMessageContainer.find('.text').append('<br>').append($msgSpan);
                                if ($chat.scrollTop() > $chat[0].scrollHeight - $chat.height() - lastMessageContainer.find('.text').height()) {
                                    $chat.scrollTop($chat[0].scrollHeight);
                                }

                                return;
                            }
                        } else {
                            $from.find('.un').html((fromName ? cleanHTMLMessage(fromName) : 'Unknown'));
                        }
                    } else {
                        $from.find('.un').html((fromName ? cleanHTMLMessage(fromName) : 'plug&#179;'));
                    }

                    $chat.append($message.append($box).append($msg.append($text)));
                    if (b) {
                        $chat.scrollTop($chat[0].scrollHeight);
                    }
                },
                getRoomID: function() {
                    return document.location.pathname.split('/')[1];
                },
                getRoomName: function() {
                    return $('#room-name').text().trim();
                },
                getUserData: function(uid, key, defaultValue) {
                    if (plugcubedUserData[uid] == null || plugcubedUserData[uid][key] == null) {
                        return defaultValue;
                    }

                    return plugcubedUserData[uid][key];
                },
                setUserData: function(uid, key, value) {
                    if (plugcubedUserData[uid] == null) {
                        plugcubedUserData[uid] = {};
                    }
                    plugcubedUserData[uid][key] = value;
                },
                getUser: function(data) {
                    var method = 'number';

                    if (typeof data === 'string') {
                        method = 'string';
                        data = data.trim();
                        if (data.substr(0, 1) === '@') {
                            data = data.substr(1);
                        }
                    }

                    var users = API.getUsers();

                    for (var i = 0; i < users.length; i++) {
                        if (!users[i]) continue;
                        if (method === 'string') {
                            if (this.equalsIgnoreCase(users[i].username, data) || this.equalsIgnoreCaseTrim(users[i].id.toString(), data)) {
                                return users[i];
                            }
                            continue;
                        }
                        if (method === 'number') {
                            if (users[i].id === data) {
                                return users[i];
                            }
                        }
                    }

                    return null;
                },
                getLastMessageTime: function(uid) {
                    var time = Date.now() - this.getUserData(uid, 'lastChat', this.getUserData(uid, 'joinTime', Date.now()));
                    var IgnoreCollection = window.plugCubedModules.ignoreCollection;

                    if (IgnoreCollection._byId[uid] === true) {
                        return p3Lang.i18n('error.ignoredUser');
                    }

                    return this.getRoundedTimestamp(time, true);
                },
                getUserInfo: function(data) {
                    var user = this.getUser(data);

                    if (user === null) {
                        this.chatLog(undefined, p3Lang.i18n('error.userNotFound'));
                    } else {
                        var rank, status, voted, position, waitlistpos, inbooth, lang, lastMessage, disconnectInfo;

                        waitlistpos = API.getWaitListPosition(user.id);
                        inbooth = API.getDJ() != null && API.getDJ().id === user.id;
                        lang = Lang.languages[user.language];
                        lastMessage = this.getLastMessageTime(user.id);
                        disconnectInfo = this.getUserData(user.id, 'disconnects', {
                            count: 0
                        });

                        if (this.hasPermission(user.id, 5, true)) {
                            rank = Lang.roles.admin;
                        } else if (this.hasPermission(user.id, 4, true)) {
                            rank = Lang.roles.leader;
                        } else if (this.hasPermission(user.id, 3, true)) {
                            rank = Lang.roles.ambassador;
                        } else if (this.hasPermission(user.id, 2, true)) {
                            rank = Lang.roles.volunteer;
                        } else if (this.hasPermission(user.id, API.ROLE.HOST)) {
                            rank = Lang.roles.host;
                        } else if (this.hasPermission(user.id, API.ROLE.COHOST)) {
                            rank = Lang.roles.cohost;
                        } else if (this.hasPermission(user.id, API.ROLE.MANAGER)) {
                            rank = Lang.roles.manager;
                        } else if (this.hasPermission(user.id, API.ROLE.BOUNCER)) {
                            rank = Lang.roles.bouncer;
                        } else if (this.hasPermission(user.id, API.ROLE.DJ)) {
                            rank = Lang.roles.dj;
                        } else {
                            rank = Lang.roles.none;
                        }

                        if (inbooth) {
                            position = p3Lang.i18n('info.djing');
                        } else if (waitlistpos > -1) {
                            position = p3Lang.i18n('info.inWaitlist', waitlistpos + 1, API.getWaitList().length);
                        } else {
                            position = p3Lang.i18n('info.notInList');
                        }

                        status = Lang.userStatus.online;

                        switch (user.vote) {
                            case -1:
                                voted = p3Lang.i18n('vote.meh');
                                break;
                            default:
                                voted = p3Lang.i18n('vote.undecided');
                                break;
                            case 1:
                                voted = p3Lang.i18n('vote.woot');
                                break;
                        }
                        if (inbooth) {
                            voted = p3Lang.i18n('vote.djing');
                        }

                        var title = this.getAllPlugCubedRanks(user.id, true);
                        var message = $('<table>').css({
                            width: '100%',
                            color: '#CC00CC',
                            'font-size': '1.02em'
                        });

                        // Username
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.name') + ' ')).append($('<span>').css('color', '#FFFFFF').text(this.cleanTypedString(user.username)))));

                        // Title
                        if (title !== '') {
                            message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.title') + ' ')).append($('<span>').css('color', '#FFFFFF').html(title))));
                        }

                        // UserID
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.id') + ' ')).append($('<span>').css('color', '#FFFFFF').text(user.id))));

                        // Rank / Time Joined
                        message.append($('<tr>').append($('<td>').append($('<strong>').text(p3Lang.i18n('info.rank') + ' ')).append($('<span>').css('color', '#FFFFFF').text(rank))).append($('<td>').append($('<strong>').text(p3Lang.i18n('info.joined') + ' ')).append($('<span>').css('color', '#FFFFFF').text(this.getTimestamp(this.getUserData(user.id, 'joinTime', Date.now()))))));

                        // Status / Vote
                        message.append($('<tr>').append($('<td>').append($('<strong>').text(p3Lang.i18n('info.status') + ' ')).append($('<span>').css('color', '#FFFFFF').text(status))).append($('<td>').append($('<strong>').text(p3Lang.i18n('info.vote') + ' ')).append($('<span>').css('color', '#FFFFFF').text(voted))));

                        // Position
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.position') + ' ')).append($('<span>').css('color', '#FFFFFF').text(position))));

                        // Language
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(Lang.languages.label + ' ')).append($('<span>').css('color', '#FFFFFF').text(lang))));

                        // Last Message
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.lastMessage') + ' ')).append($('<span>').css('color', '#FFFFFF').text(lastMessage))));

                        // Woot / Meh
                        message.append($('<tr>').append($('<td>').append($('<strong>').text(p3Lang.i18n('info.wootCount') + ' ')).append($('<span>').css('color', '#FFFFFF').text(this.getUserData(user.id, 'wootcount', 0)))).append($('<td>').append($('<strong>').text(p3Lang.i18n('info.mehCount') + ' ')).append($('<span>').css('color', '#FFFFFF').text(this.getUserData(user.id, 'mehcount', 0)))));

                        // Ratio
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.ratio') + ' ')).append($('<span>').css('color', '#FFFFFF').text((function(a, b) {
                            if (b === 0) return a === 0 ? '0:0' : '1:0';
                            for (var i = 1; i <= b; i++) {
                                var e = i * (a / b);

                                if (e % 1 === 0) return e + ':' + i;
                            }
                        })(this.getUserData(user.id, 'wootcount', 0), this.getUserData(user.id, 'mehcount', 0))))));

                        // Disconnects
                        message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.disconnects') + ' ')).append($('<span>').css('color', '#FFFFFF').text(disconnectInfo.count))));
                        if (disconnectInfo.count > 0) {

                            // Last Position
                            message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.lastPosition') + ' ')).append($('<span>').css('color', '#FFFFFF').text(disconnectInfo.position < 0 ? 'Wasn\'t in booth nor waitlist' : (disconnectInfo.position === 0 ? 'Was DJing' : 'Was ' + disconnectInfo.position + ' in waitlist')))));

                            // Last Disconnect Time
                            message.append($('<tr>').append($('<td>').attr('colspan', 2).append($('<strong>').text(p3Lang.i18n('info.lastDisconnect') + ' ')).append($('<span>').css('color', '#FFFFFF').text(this.getTimestamp(disconnectInfo.time)))));
                        }

                        this.chatLog(undefined, $('<div>').append(message).html());
                    }
                },
                hasPermission: function(uid, permission, hasGRole) {
                    var user = API.getUser(uid);

                    if (user && user.id) {
                        return hasGRole ? user.gRole >= permission : user.role >= permission || user.gRole >= permission;
                    }

                    return false;
                },
                getAllUsers: function() {
                    var table = $('<table>').css({
                        width: '100%',
                        color: '#CC00CC'
                    });
                    var users = API.getUsers();

                    for (var i in users) {
                        if (users.hasOwnProperty(i)) {
                            var user = users[i];

                            table.append($('<tr>').append($('<td>').append(user.username)).append($('<td>').append(user.id)));
                        }
                    }
                    this.chatLog(undefined, $('<div>').append(table).html());
                },
                playChatSound: function() {

                    // Should get another sound, until then - use mention sound
                    this.playMentionSound();
                },
                playMentionSound: function(playCount) {
                    if (!playCount) playCount = 2;

                    var count = 0;

                    if (Database.settings.chatSound) {
                        var mentionSound = new Audio(PlugUI.sfx);

                        mentionSound.addEventListener('ended', function() {
                            count++;
                            if (playCount === count) return mentionSound.pause();
                            mentionSound.currentTime = 0;
                            mentionSound.play();

                        });
                        mentionSound.play();
                    }
                },
                getTimestamp: function(t, format) {
                    var time, hours, minutes, seconds;
                    var postfix = '';

                    if (!format) {
                        format = 'hh:mm';
                    }

                    time = t ? new Date(t) : new Date();

                    hours = time.getHours();
                    minutes = time.getMinutes();
                    seconds = time.getSeconds();

                    if (this.is24Hours()) {
                        if (hours < 12) {
                            postfix = ' am';
                        } else {
                            postfix = ' pm';
                            hours -= 12;
                        }
                        if (hours === 0) {
                            hours = 12;
                        }
                    }
                    minutes = (minutes < 10 ? '0' : '') + minutes;
                    seconds = (seconds < 10 ? '0' : '') + seconds;

                    return format.split('hh').join(hours).split('mm').join(minutes).split('ss').join(seconds) + postfix;
                },
                getRoundedTimestamp: function(t, milliseconds) {
                    if (milliseconds) {
                        t = Math.floor(t / 1000);
                    }

                    var units = {
                        week: 604800,
                        day: 86400,
                        hour: 3600,
                        minute: 60,
                        second: 1
                    };

                    for (var i in units) {
                        if (!units.hasOwnProperty(i)) continue;
                        var unit = units[i];

                        if (t < unit) continue;

                        var numberOfUnit = Math.floor(t / unit);

                        return numberOfUnit + ' ' + i + (numberOfUnit > 1 ? 's' : '') + ' ago';
                    }

                    return 'Unknown';
                },
                formatTime: function(seconds) {
                    var hours, minutes;

                    minutes = Math.floor(seconds / 60);
                    seconds -= minutes * 60;

                    if (minutes < 60) {
                        return (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                    }

                    hours = Math.floor(minutes / 60);
                    minutes -= hours * 60;

                    return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
                },
                randomRange: function(min, max) {
                    return min + Math.floor(Math.random() * (max - min + 1));
                },
                isRGB: function(text) {
                    return typeof text === 'string' ? /^(#|)(([0-9A-F]{6}$)|([0-9A-F]{3}$))/i.test(text) : false;
                },
                toRGB: function(text) {
                    return this.isRGB(text) ? text.substr(0, 1) === '#' ? text : '#' + text : undefined;
                },
                equalsIgnoreCase: function(a, b) {
                    return typeof a === 'string' && typeof b === 'string' ? a.toLowerCase() === b.toLowerCase() : false;
                },
                equalsIgnoreCaseTrim: function(a, b) {
                    return typeof a === 'string' && typeof b === 'string' ? a.trim().toLowerCase() === b.trim().toLowerCase() : false;
                },
                startsWith: function(a, b) {
                    if (typeof a === 'string') {
                        if (typeof b === 'string' && a.length >= b.length) {
                            return a.indexOf(b) === 0;
                        } else if (_.isArray(b)) {
                            for (var c = 0; c < b.length; c++) {
                                if (!b[c]) continue;
                                var d = b[c];

                                if (typeof d === 'string' && this.startsWith(a, d)) {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                endsWith: function(a, b) {
                    if (typeof a === 'string') {
                        if (typeof b === 'string' && a.length >= b.length) {
                            return a.indexOf(b, a.length - b.length) !== -1;
                        } else if (_.isArray(b)) {
                            for (var c = 0; c < b.length; c++) {
                                if (!b[c]) continue;
                                var d = b[c];

                                if (typeof d === 'string' && this.endsWith(a, d)) {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                startsWithIgnoreCase: function(a, b) {
                    if (typeof a === 'string') {
                        if (typeof b === 'string' && a.length >= b.length) {
                            return this.startsWith(a.toLowerCase(), b.toLowerCase());
                        } else if (_.isArray(b)) {
                            for (var c = 0; c < b.length; c++) {
                                if (!b[c]) continue;
                                var d = b[c];

                                if (typeof d === 'string' && this.startsWithIgnoreCase(a, d)) {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                endsWithIgnoreCase: function(a, b) {
                    if (typeof a === 'string') {
                        if (typeof b === 'string' && a.length >= b.length) {
                            return this.endsWith(a.toLowerCase(), b.toLowerCase());
                        } else if (_.isArray(b)) {
                            for (var c = 0; c < b.length; c++) {
                                if (!b[c]) continue;
                                var d = b[c];

                                if (typeof d === 'string' && this.endsWithIgnoreCase(a, d)) {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                getBaseURL: function(url) {
                    return url.indexOf('#') > -1 ? url.substr(0, url.indexOf('#')) : (url.indexOf('?') > -1 ? url.substr(0, url.indexOf('?')) : url);
                },
                getRandomString: function(length) {
                    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
                    var i;
                    var ret = [];

                    for (i = 0; i < length; i++) {
                        ret.push(chars.substr(Math.floor(Math.random() * chars.length), 1));
                    }

                    return ret.join('');
                },
                getRank: function(user) {
                    user = API.getUser(user);

                    if (user.gRole) {
                        return user.gRole === 5 ? 'admin' : 'ambassador';
                    }

                    return ['regular', 'dj', 'bouncer', 'manager', 'cohost', 'host'][user.role || 0];
                },
                logColors: {
                    userCommands: '66FFFF',
                    modCommands: 'FF0000',
                    infoMessage1: 'FFFF00',
                    infoMessage2: '66FFFF'
                },
                objectSelector: function(obj, selector, defaultValue) {
                    var a = obj;

                    var key = selector.split('.');

                    for (var i in key) {
                        if (!key.hasOwnProperty(i)) continue;
                        if (a[key[i]] == null) {
                            return defaultValue;
                        }
                        a = a[key[i]];
                    }

                    return a;
                },
                statusREST: function(call) {
                    var time;

                    $.ajax({
                        url: 'https://plug.dj/_/rooms',
                        type: 'HEAD',
                        cache: false,
                        crossDomain: true,
                        timeout: 10000,
                        beforeSend: function() {
                            time = Date.now();
                        },
                        complete: function(req) {
                            call(req.status, req.statusText, Date.now() - time);
                        }
                    });
                },
                getOrdinal: function(num) {
                    var suffixes = ['th', 'st', 'nd', 'rd'];
                    var remainder = num % 100;

                    return num + (suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]);

                },
                statusSocket: function(call) {
                    var att = 0;
                    var time = Date.now();
                    var conn;

                    function connect() {
                        conn = new WebSocket('wss://godj.plug.dj:443/socket');
                        conn.onopen = function() {
                            conn.close();
                        };

                        conn.onclose = function(req) {
                            if (req.code !== 1000) {
                                if (att < 3) setTimeout(connect, 500);
                                if (att === 3) call(req.code, req.reason, Date.now() - time);
                                att++;

                                return;
                            }
                            call(req.code, req.reason, Date.now() - time);
                        };
                    }
                    connect();
                }
            });

            return new Handler();
        });


        define('plugCubed/StyleManager', ['jquery', 'plugCubed/Class', 'plugCubed/Utils'], function($, Class, p3Utils) {
            var obj;
            var styles = {};
            var imports = [];
            var PopoutView = window.plugCubedModules.PopoutView;

            function update() {
                var a = '';
                var i;

                for (i = 0; i < imports.length; i++) {
                    if (imports[i]) {
                        a += '@import url("' + imports[i] + '");\n';
                    }
                }

                for (i in styles) {
                    if (styles.hasOwnProperty(i)) {
                        a += styles[i] + '\n';
                    }
                }

                obj.text(a);
                if (PopoutView && PopoutView._window) {
                    $(PopoutView._window.document).find('#plugCubedStyles').text(a);
                }
            }

            var A = Class.extend({
                init: function() {
                    obj = $('<style type="text/css">');
                    $('body').prepend(obj);
                },
                getList: function() {
                    for (var key in styles) {
                        if (!styles.hasOwnProperty(key)) continue;
                        console.log('[plug³ StyleManager]', key, styles);
                    }
                },
                get: function(key) {
                    return styles[key];
                },
                addImport: function(url) {
                    if (imports.indexOf(url) > -1) return;
                    imports.push(url);
                    update();
                },
                clearImports: function() {
                    if (imports.length === 0) return;
                    imports = [];
                    update();
                },
                set: function(key, style) {
                    styles[key] = style;
                    update();
                },
                has: function(key) {
                    return styles[key] != null;
                },
                unset: function(key) {
                    if (typeof key === 'string') {
                        key = [key];
                    }

                    var doUpdate = false;

                    for (var i in key) {
                        if (key.hasOwnProperty(i) && this.has(key[i])) {
                            delete styles[key[i]];
                            doUpdate = true;
                        }
                    }

                    if (doUpdate) {
                        update();
                    }
                },
                destroy: function() {
                    styles = {};
                    obj.remove();
                }
            });

            return new A();
        });

        /**
         Modified version of plug.dj's VolumeView
         VolumeView copyright (C) 2014 by Plug DJ, Inc.
         */
        define('plugCubed/bridges/VolumeView', ['jquery', 'plugCubed/Lang', 'plugCubed/Utils'], function($, p3Lang, p3Utils) {
            var Context = window.plugCubedModules.context;
            var Original = window.plugCubedModules.Volume;
            var _PlaybackModel;

            return Original.extend({
                initialize: function(PlaybackModel) {
                    _PlaybackModel = PlaybackModel;
                    this._super();
                },
                render: function() {
                    this._super();
                    this.$('.button').mouseover(function() {
                        if (typeof window.plugCubed !== 'undefined') {
                            if (_PlaybackModel.get('mutedOnce')) {
                                Context.trigger('tooltip:show', p3Lang.i18n('tooltip.mutedOnce'), $(this), true);
                            } else if (_PlaybackModel.get('muted')) {
                                Context.trigger('tooltip:show', p3Lang.i18n('tooltip.muted'), $(this), true);
                            }
                        }
                    }).mouseout(function() {
                        if (typeof window.plugCubed !== 'undefined') {
                            Context.trigger('tooltip:hide');
                        }
                    });
                    this.onChange();

                    return this;
                },
                remove: function() {
                    this._super();
                    var volume = new Original();

                    $('#now-playing-bar').append(volume.$el);
                    volume.render();
                },
                onClick: function() {
                    if (_PlaybackModel.get('mutedOnce')) {
                        _PlaybackModel.set('volume', _PlaybackModel.get('lastVolume'));
                    } else if (_PlaybackModel.get('muted')) {
                        _PlaybackModel.onVolumeChange();
                        this.onChange();
                    } else if (_PlaybackModel.get('volume') > 0) {
                        _PlaybackModel.set({
                            lastVolume: _PlaybackModel.get('volume'),
                            volume: 0
                        });
                    }
                    if (typeof window.plugCubed !== 'undefined') {
                        Context.trigger('tooltip:hide');
                        if (_PlaybackModel.get('mutedOnce')) {
                            Context.trigger('tooltip:show', p3Lang.i18n('tooltip.mutedOnce'), this.$('.button'), true);
                        } else if (_PlaybackModel.get('muted')) {
                            Context.trigger('tooltip:show', p3Lang.i18n('tooltip.muted'), this.$('.button'), true);
                        } else {
                            Context.trigger('tooltip:hide');
                        }
                    }
                },
                onChange: function() {
                    var currentVolume = _PlaybackModel.get('volume');

                    this.$span.text(currentVolume + '%');
                    this.$circle.css('left', parseInt(this.$hit.css('left'), 10) + this.max * (currentVolume / 100) - this.$circle.width() / 2);
                    if (currentVolume > 60 && !this.$icon.hasClass('icon-volume-on')) {
                        this.$icon.removeClass().addClass('icon icon-volume-on');
                    } else if (currentVolume > 0 && !this.$icon.hasClass('icon-volume-half')) {
                        this.$icon.removeClass().addClass('icon icon-volume-half');
                    } else if (currentVolume === 0) {
                        if (_PlaybackModel.get('mutedOnce')) {
                            if (!this.$icon.hasClass('icon-volume-off-once')) {
                                this.$icon.removeClass().addClass('icon icon-volume-off-once');
                            }
                        } else if (!this.$icon.hasClass('icon-volume-off')) {
                            this.$icon.removeClass().addClass('icon icon-volume-off');
                        }
                    }
                }
            });
        });

        define('plugCubed/bridges/PlaybackModel', ['plugCubed/Class', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/bridges/VolumeView'], function(Class, p3Utils, p3Lang, VolumeView) {
            var Handler, volume, PlaybackModel;

            PlaybackModel = window.plugCubedModules.currentMedia;

            function onMediaChange() {
                if (PlaybackModel.get('mutedOnce') === true) {
                    PlaybackModel.set('volume', PlaybackModel.get('lastVolume'));
                }
            }

            Handler = Class.extend({
                init: function() {
                    var that = this;

                    PlaybackModel.off('change:volume', PlaybackModel.onVolumeChange);
                    PlaybackModel.onVolumeChange = function() {
                        if (typeof window.plugCubed === 'undefined') {
                            this.set('muted', this.get('volume') === 0);
                        } else {
                            if (!_.isBoolean(this.get('mutedOnce'))) {
                                this.set('mutedOnce', false);
                            }

                            if (this.get('volume') === 0) {
                                if (!this.get('muted')) {
                                    this.set('muted', true);
                                } else if (!this.get('mutedOnce')) {
                                    this.set('mutedOnce', true);
                                } else {
                                    this.set('mutedOnce', false);
                                    this.set('muted', false);
                                }
                            } else {
                                this.set('mutedOnce', false);
                                this.set('muted', false);
                            }
                        }
                    };
                    PlaybackModel.on('change:volume', PlaybackModel.onVolumeChange);

                    PlaybackModel.on('change:media', onMediaChange);
                    PlaybackModel._events['change:media'].unshift(PlaybackModel._events['change:media'].pop());

                    setTimeout(function() {
                        $('#volume').remove();
                        volume = new VolumeView(that);
                        $('#now-playing-bar').append(volume.$el);
                        volume.render();
                    }, 1);
                },
                onVolumeChange: function() {
                    PlaybackModel.onVolumeChange();
                },
                get: function(key) {
                    return PlaybackModel.get(key);
                },
                set: function(key, value) {
                    PlaybackModel.set(key, value);
                },
                mute: function() {
                    while (!PlaybackModel.get('muted') || PlaybackModel.get('mutedOnce')) {
                        volume.onClick();
                    }
                },
                muteOnce: function() {
                    while (!PlaybackModel.get('mutedOnce')) {
                        volume.onClick();
                    }
                },
                unmute: function() {
                    while (PlaybackModel.get('muted')) {
                        volume.onClick();
                    }
                },
                close: function() {}
            });

            return new Handler();
        });

        define('plugCubed/Settings', ['plugCubed/Class', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/StyleManager', 'plugCubed/bridges/PlaybackModel'], function(Class, p3Utils, p3Lang, Styles, PlaybackModel) {
            var names = [];
            var curVersion;

            // Misc
            names.push('version');

            // Features
            names.push('autowoot', 'autojoin', 'autorespond', 'awaymsg', 'chatLog', 'etaTimer', 'notify', 'customColors', 'moderation', 'notifySongLength', 'useRoomSettings', 'chatImages', 'twitchEmotes', 'songTitle', 'boothAlert', 'badges');

            // Registers
            names.push('registeredSongs', 'alertson', 'colors');

            curVersion = 3.2;

            function upgradeVersion(save) {
                switch (save.version) {
                    case undefined:
                    case 1:

                        // Inline Images => Chat Images
                        if (save.inlineimages != null) {
                            save.chatImages = save.inlineimages;
                        }

                        // Moderation
                        if (save.moderation == null) {
                            save.moderation = {};
                        }
                        if (save.afkTimers != null) {
                            save.moderation.afkTimers = save.afkTimers;
                        }
                        break;
                    case 2:

                        // Curate => Grab
                        if (save.colors != null) {
                            save.colors = {};
                        }
                        if (save.colors.curate != null) {
                            save.colors.grab = save.colors.curate;
                        }
                        break;
                    case 3:
                        if (save.colors.leave != null) {
                            save.colors.leave = 'E26728';
                        }
                        break;
                    case 3.1:
                        if (save.colors.boothAlert != null) {
                            save.colors.boothAlert = 'AC76FF';
                        }
                        break;
                    default:
                        break;
                }
                console.log('[plug³] Updated save', save.version, '=>', curVersion);
                save.version = curVersion;

                return save;
            }

            var Controller = Class.extend({
                recent: false,
                awaymsg: '',
                autowoot: false,
                badges: true,
                chatLog: false,
                autojoin: false,
                autorespond: false,
                notify: 0,
                customColors: false,
                chatImages: true,
                twitchEmotes: false,
                songTitle: false,
                registeredSongs: [],
                alertson: [],
                etaTimer: true,
                moderation: {
                    afkTimers: false,
                    inlineUserInfo: false,
                    showDeletedMessages: false
                },
                boothAlert: 1,
                notifySongLength: 10,
                useRoomSettings: {},
                colorInfo: {
                    ranks: {
                        you: {
                            title: 'ranks.you',
                            color: 'FFDD6F'
                        },
                        regular: {
                            title: 'ranks.regular',
                            color: 'B0B0B0'
                        },
                        residentdj: {
                            title: 'ranks.residentdj',
                            color: 'AC76FF'
                        },
                        bouncer: {
                            title: 'ranks.bouncer',
                            color: 'AC76FF'
                        },
                        manager: {
                            title: 'ranks.manager',
                            color: 'AC76FF'
                        },
                        cohost: {
                            title: 'ranks.cohost',
                            color: 'AC76FF'
                        },
                        host: {
                            title: 'ranks.host',
                            color: 'AC76FF'
                        },
                        ambassador: {
                            title: 'ranks.ambassador',
                            color: '89BE6C'
                        },
                        admin: {
                            title: 'ranks.admin',
                            color: '42A5DC'
                        }
                    },
                    notifications: {
                        join: {
                            title: 'notify.join',
                            color: '3366FF'
                        },
                        leave: {
                            title: 'notify.leave',
                            color: 'E26728'
                        },
                        grab: {
                            title: 'notify.grab',
                            color: '00FF00'
                        },
                        meh: {
                            title: 'notify.meh',
                            color: 'FF0000'
                        },
                        stats: {
                            title: 'notify.stats',
                            color: '66FFFF'
                        },
                        updates: {
                            title: 'notify.updates',
                            color: 'FFFF00'
                        },
                        boothAlert: {
                            title: 'notify.boothAlert',
                            color: 'AC76FF'
                        },
                        songLength: {
                            title: 'notify.songLength',
                            color: '66FFFF'
                        }
                    }
                },
                colors: {
                    you: 'FFDD6F',
                    regular: 'B0B0B0',
                    residentdj: 'AC76FF',
                    bouncer: 'AC76FF',
                    manager: 'AC76FF',
                    cohost: 'AC76FF',
                    host: 'AC76FF',
                    ambassador: '89BE6C',
                    admin: '42A5DC',
                    join: '3366FF',
                    leave: 'E26728',
                    grab: '00FF00',
                    meh: 'FF0000',
                    stats: '66FFFF',
                    updates: 'FFFF00',
                    boothAlert: 'AC76FF',
                    songLength: '66FFFF'
                },
                load: function() {
                    try {
                        var save = JSON.parse(localStorage.getItem('plugCubed')) || {};

                        // Upgrade if needed
                        if (save.version == null || save.version !== curVersion) {
                            save = upgradeVersion(save);
                            this.save();
                        }

                        // Get the settings
                        for (var i = 0; i < names.length; i++) {
                            if (!names[i]) continue;
                            if (save[names[i]] != null && typeof this[names[i]] == typeof save[names[i]]) {
                                if ($.isPlainObject(this[names[i]])) {
                                    if (_.isEmpty(this[names[i]]) && !_.isEmpty(save[names[i]])) {
                                        this[names[i]] = save[names[i]];
                                    } else {
                                        for (var j in this[names[i]]) {
                                            if (!this[names[i]].hasOwnProperty(j)) continue;
                                            if (save[names[i]][j] != null) {
                                                this[names[i]][j] = save[names[i]][j];
                                            }
                                        }
                                    }
                                } else {
                                    this[names[i]] = save[names[i]];
                                }
                            }
                        }

                        if (this.autowoot) {
                            (function() {
                                var dj = API.getDJ();

                                if (dj == null || dj.id === API.getUser().id) return;
                                $('#woot').click();
                            })();
                        }

                        if (this.autojoin) {
                            (function() {
                                var dj = API.getDJ();

                                if (dj == null || dj.id === API.getUser().id || API.getWaitListPosition() > -1) return;
                                $('#dj-button').click();
                            })();
                        }

                        if (this.twitchEmotes) {
                            require('plugCubed/handlers/ChatHandler').loadTwitchEmotes();
                        }

                        if (!this.badges) {
                            Styles.set('hide-badges', '#chat .msg { padding: 5px 8px 6px 8px; } #chat-messages .badge-box { display: none; }');
                        }

                        if (this.registeredSongs.length > 0 && API.getMedia() != null && this.registeredSongs.indexOf(API.getMedia().id) > -1) {
                            PlaybackModel.muteOnce();
                            API.chatLog(p3Lang.i18n('automuted', API.getMedia().title));
                        }

                        if (this.etaTimer) {
                            Styles.set('etaTimer', '#your-next-media .song { top: 8px!important; }');
                        }
                    } catch (e) {
                        console.error('[plug³ Settings] Error loading settings', e.stack);
                        p3Utils.chatLog('system', 'Error loading settings');
                    }
                },
                save: function() {
                    var settings = {};

                    for (var i = 0; i < names.length; i++) {
                        if (names[i]) {
                            settings[names[i]] = this[names[i]];
                        }
                    }

                    settings.version = curVersion;
                    localStorage.setItem('plugCubed', JSON.stringify(settings));
                }
            });

            return new Controller();
        });

        define('plugCubed/enums/Notifications', [], function() {
            return {
                USER_JOIN: 1,
                USER_LEAVE: 2,
                USER_GRAB: 4,
                SONG_STATS: 8,
                SONG_UPDATE: 16,
                SONG_HISTORY: 32,
                SONG_LENGTH: 64,
                USER_MEH: 128,
                SONG_UNAVAILABLE: 256,
                BOOTH_ALERT: 512
            };
        });

        define('plugCubed/notifications/History', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var history = [];
            var Handler = TriggerHandler.extend({
                trigger: {
                    advance: 'onDjAdvance',
                    modSkip: 'onSkip',
                    userSkip: 'onSkip',
                    voteSkip: 'onSkip'
                },
                register: function() {
                    this.getHistory();
                    this._super();
                },
                isInHistory: function(cid) {
                    var info = {
                        pos: -1,
                        inHistory: false,
                        skipped: false,
                        length: history.length
                    };

                    for (var i in history) {
                        if (!history.hasOwnProperty(i)) continue;
                        var a = history[i];

                        if (a.cid === cid && (~~i + 1) < history.length) {
                            info.pos = ~~i + 2;
                            info.inHistory = true;
                            if (!a.wasSkipped) {
                                return info;
                            }
                        }
                    }
                    info.skipped = info.pos > -1;

                    return info;
                },
                onHistoryCheck: function(cid) {
                    if ((!API.hasPermission(undefined, API.ROLE.BOUNCER) && !p3Utils.isPlugCubedDeveloper()) || (Settings.notify & enumNotifications.SONG_HISTORY) !== enumNotifications.SONG_HISTORY) return;
                    var historyData = this.isInHistory(cid);

                    if (historyData.inHistory) {
                        if (!historyData.skipped) {
                            p3Utils.playMentionSound();
                            p3Utils.chatLog('system', p3Lang.i18n('notify.message.history', historyData.pos, historyData.length) + '<br><span onclick="if (API.getMedia().cid === \'' + cid + '\') API.moderateForceSkip()" style="cursor:pointer;">Click here to skip</span>', undefined, -3);
                        } else {
                            p3Utils.chatLog('system', p3Lang.i18n('notify.message.historySkipped', historyData.pos, historyData.length), undefined, -3);
                        }
                    }
                },
                onDjAdvance: function(data) {
                    if (data.media == null) return;
                    this.onHistoryCheck(data.media.cid);
                    var obj = {
                        id: data.media.cid,
                        author: data.media.author,
                        title: data.media.title,
                        wasSkipped: false,
                        user: {
                            id: data.dj.id,
                            username: data.dj.username
                        }
                    };

                    if (history.unshift(obj) > 50) {
                        history.splice(50, history.length - 50);
                    }
                },
                onSkip: function() {
                    history[1].wasSkipped = true;
                },
                getHistory: function() {
                    history = [];
                    var data = API.getHistory();

                    for (var i in data) {
                        if (!data.hasOwnProperty(i)) continue;
                        var a = data[i];
                        var obj = {
                            cid: a.media.cid,
                            author: a.media.author,
                            title: a.media.title,
                            wasSkipped: false,
                            dj: {
                                id: a.user.id.toString(),
                                username: a.user.username
                            }
                        };

                        history.push(obj);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/SongLength', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: API.ADVANCE,
                handler: function(data) {
                    if ((Settings.notify & enumNotifications.SONG_LENGTH) === enumNotifications.SONG_LENGTH && data.media.duration > Settings.notifySongLength * 60 && p3Utils.hasPermission(undefined, API.ROLE.BOUNCER)) {
                        p3Utils.playMentionSound();
                        p3Utils.chatLog('system', p3Lang.i18n('notify.message.songLength', Settings.notifySongLength) + '<br><span onclick="if (API.getMedia().id === \'' + data.id + '\') API.moderateForceSkip()" style="cursor:pointer;">Click here to skip</span>', Settings.colors.songLength || Settings.colorInfo.notifications.songLength.color, -2);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/SongStats', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: API.ADVANCE,
                handler: function(data) {
                    if ((Settings.notify & enumNotifications.SONG_STATS) === enumNotifications.SONG_STATS && data.lastPlay != null && data.lastPlay.score != null) {
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.stats', data.lastPlay.score.positive, data.lastPlay.score.negative, data.lastPlay.score.grabs), Settings.colors.stats || Settings.colorInfo.notifications.stats.color, -5);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/SongUpdate', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: API.ADVANCE,
                handler: function(data) {
                    if ((Settings.notify & enumNotifications.SONG_UPDATE) === enumNotifications.SONG_UPDATE && data.media != null && data.dj != null) {
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.updates', p3Utils.cleanTypedString(data.media.title), p3Utils.cleanTypedString(data.media.author), p3Utils.cleanTypedString(data.dj.username)), Settings.colors.updates || Settings.colorInfo.notifications.updates.color, -7);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/UserGrab', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: API.GRAB_UPDATE,
                handler: function(data) {
                    var media = API.getMedia();

                    if ((Settings.notify & enumNotifications.USER_GRAB) === enumNotifications.USER_GRAB && media != null) {
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.grab', media.author, media.title), Settings.colors.grab || Settings.colorInfo.notifications.grab.color, data.user.id);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/UserJoin', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var lastJoin = {};
            var Handler = TriggerHandler.extend({
                trigger: API.USER_JOIN,
                handler: function(data) {
                    if ((Settings.notify & enumNotifications.USER_JOIN) === enumNotifications.USER_JOIN && (lastJoin[data.id] == null || lastJoin[data.id] < Date.now() - 5e3)) {

                        // TODO: Add check if friend
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.join'), Settings.colors.join || Settings.colorInfo.notifications.join.color, data.id, data.username);
                    }

                    lastJoin[data.id] = Date.now();

                    if (p3Utils.getUserData(data.id, 'joinTime', 0) === 0) {
                        p3Utils.setUserData(data.id, 'joinTime', Date.now());
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/UserLeave', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var lastLeave = {};
            var Handler = TriggerHandler.extend({
                trigger: API.USER_LEAVE,
                handler: function(data) {
                    var disconnects = p3Utils.getUserData(data.id, 'disconnects', {
                        count: 0
                    });

                    if ((Settings.notify & enumNotifications.USER_LEAVE) === enumNotifications.USER_LEAVE && (disconnects.time == null || Date.now() - disconnects.time < 1000) && (lastLeave[data.id] == null || lastLeave[data.id] < Date.now() - 5e3)) {

                        // TODO: Add check if friend
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.leave'), Settings.colors.leave || Settings.colorInfo.notifications.leave.color, data.id, data.username);
                    }
                    lastLeave[data.id] = Date.now();
                }
            });

            return new Handler();
        });

        define('plugCubed/RoomSettings', ['jquery', 'underscore', 'plugCubed/Class', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/StyleManager', 'plugCubed/Settings'], function($, _, Class, p3Utils, p3Lang, Styles, Settings) {

            var Context, Layout, PlugUI, RoomModel, RoomLoader, Handler, showMessage, oriLang, Lang, langKeys, ranks, that;

            /**
             * @property {{ background: String, chat: { admin: String, ambassador: String, bouncer: String, cohost: String, residentdj: String, host: String, manager: String }, footer: String, header: String }} colors
             * @property {{ font: Array, import: Array, rule: Array }} css
             * @property {{ background: String, booth: String, icons: { admin: String, ambassador: String, bouncer: String, cohost: String, residentdj: String, host: String, manager: String }, playback: String }} images
             * @property {{ plugCubed: Object, plugDJ: Object }} text
             * @property {{ allowAutorespond: Boolean, allowAutojoin: Boolean, allowAutowoot: Boolean }} rules
             * @property {String|undefined} roomscript
             */
            var roomSettings; // eslint-disable-line one-var

            Context = window.plugCubedModules.context;
            Layout = window.plugCubedModules.Layout;
            Lang = window.plugCubedModules.Lang;
            PlugUI = window.plugCubedModules.plugUrls;
            RoomLoader = window.plugCubedModules.roomLoader;
            RoomModel = window.plugCubedModules.room;
            showMessage = false;
            oriLang = _.extend({}, Lang);
            langKeys = $.map(oriLang, function(v, i) {
                if (typeof v === 'string') {
                    return i;
                }

                return $.map(v, function(v2, i2) {
                    return i + '.' + i2;
                });
            });
            ranks = ['admin', 'ambassador', 'bouncer', 'cohost', 'residentdj', 'leader', 'host', 'manager', 'volunteer'];

            function getPlugDJLang(key, original) {
                if (!key) return '';
                var parts = key.split('.');
                var last = parts.pop();
                var partsLen = parts.length;
                var cur = original ? oriLang : Lang;

                for (var i = 0; i < partsLen; i++) {
                    var part = parts[i];

                    if (cur[part] != null) {
                        cur = cur[part];
                    } else {
                        return '';
                    }
                    if (cur[last] != null) {
                        return cur[last];
                    }
                }

                return '';
            }

            function setFooterIcon() {
                $('#footer-user .name .icon').removeClass().addClass('icon icon-chat-' + p3Utils.getRank());
            }

            function setPlugDJLang(key, value) {
                if (!key || !value) return;
                var parts = key.split('.');
                var last = parts.pop();
                var partsLen = parts.length;
                var cur = Lang;

                for (var i = 0; i < partsLen; i++) {
                    var part = parts[i];

                    if (cur[part] != null) {
                        cur = cur[part];
                    } else return;
                }
                if (cur[last] != null) {
                    cur[last] = value;
                }
            }

            function parseDescription(description) {
                var isRCS = false;

                if (description.indexOf('@p3=') > -1) {
                    description = description.substr(description.indexOf('@p3=') + 4);
                    that.haveRoomSettings = true;
                } else if (description.indexOf('@rcs=') > -1) {
                    description = description.substr(description.indexOf('@rcs=') + 5);
                    isRCS = true;
                    that.haveRoomSettings = true;
                } else {
                    that.haveRoomSettings = false;
                    require('plugCubed/CustomChatColors').update();

                    return;
                }
                if (description.indexOf('\n') > -1) {
                    description = description.substr(0, description.indexOf('\n'));
                }
                $.getJSON(p3Utils.html2text(description), function(settings) {
                    roomSettings = settings;
                    if (isRCS) {
                        roomSettings = that.convertRCSToPlugCubed(settings);
                    }
                    if (!(Settings.useRoomSettings[p3Utils.getRoomID()] != null ? Settings.useRoomSettings[p3Utils.getRoomID()] : true)) {
                        showMessage = false;
                    } else {
                        showMessage = true;
                    }
                    that.execute();
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.error(jqXHR, textStatus, errorThrown);
                    p3Utils.chatLog(undefined, 'Error loading Room Settings ' + jqXHR.status, -2);
                });
            }

            Handler = Class.extend({
                rules: {
                    allowAutowoot: true,
                    allowAutorespond: true,
                    allowAutojoin: true,
                    allowEmotes: true,
                    allowShowingMehs: true
                },
                haveRoomSettings: false,
                chatColors: {},
                chatIcons: {},
                init: function() {
                    that = this;
                    Context.on('change:role', setFooterIcon);
                    Context.on('room:joining', this.clear, this);
                    Context.on('room:joined', this.update, this);
                    setFooterIcon();
                },
                update: function() {
                    parseDescription(p3Utils.cleanHTML(RoomModel.get('description')));
                },

                // Converts RCS CCS to P3 RSS Format. Written by ReAnna.
                convertRCSToPlugCubed: function(ccs) {
                    var rs = _.clone(ccs);
                    var colors = ccs.ccc;
                    var images = ccs.images;

                    if (ccs.css) {
                        rs.css = {
                            import: [ccs.css]
                        };
                    }
                    if (colors) {
                        rs.colors = rs.colors || {};
                        rs.colors.chat = _.omit(colors, 'rdj');
                        if (colors.rdj) {
                            rs.colors.chat.residentdj = colors.rdj;
                        }
                    }
                    if (images) {
                        rs.images = _.clone(images);
                        rs.images.icons = _.omit(images, 'background', 'playback', 'rdj');
                        if (images.rdj) {
                            rs.images.icons.residentdj = images.rdj;
                        }
                    }

                    return rs;
                },
                execute: function() {
                    var i, a, loadEverything;

                    loadEverything = Settings.useRoomSettings[p3Utils.getRoomID()] != null ? Settings.useRoomSettings[p3Utils.getRoomID()] : true;

                    this.clear();
                    if (roomSettings != null) {
                        if (loadEverything) {

                            // colors
                            if (roomSettings.colors != null) {

                                // colors.background
                                if (roomSettings.colors.background != null && typeof roomSettings.colors.background === 'string' && p3Utils.isRGB(roomSettings.colors.background)) {
                                    Styles.set('room-settings-background-color', 'body { background-color: ' + p3Utils.toRGB(roomSettings.colors.background) + '!important; }');
                                }

                                // colors.chat
                                if (roomSettings.colors.chat != null) {
                                    a = {};
                                    for (i in roomSettings.colors.chat) {
                                        if (!roomSettings.colors.chat.hasOwnProperty(i)) continue;
                                        if (ranks.indexOf(i) > -1 && typeof roomSettings.colors.chat[i] === 'string' && p3Utils.isRGB(roomSettings.colors.chat[i])) {
                                            a[i] = p3Utils.toRGB(roomSettings.colors.chat[i]);
                                        }
                                    }
                                    this.chatColors = a;
                                }

                                // colors.header
                                if (roomSettings.colors.header != null && typeof roomSettings.colors.header === 'string' && p3Utils.isRGB(roomSettings.colors.header)) {
                                    Styles.set('room-settings-header', '#header { background-color: ' + p3Utils.toRGB(roomSettings.colors.header) + '!important; }');
                                }

                                // colors.footer
                                if (roomSettings.colors.footer != null && typeof roomSettings.colors.footer === 'string' && p3Utils.isRGB(roomSettings.colors.footer)) {
                                    Styles.set('room-settings-footer', '.app-header { background-color: ' + p3Utils.toRGB(roomSettings.colors.footer) + '!important; }');
                                }
                            }

                            // css
                            if (roomSettings.css != null) {

                                // css.font
                                if (roomSettings.css.font != null && _.isArray(roomSettings.css.font)) {
                                    var roomFonts = [];

                                    for (i in roomSettings.css.font) {
                                        if (!roomSettings.css.font.hasOwnProperty(i)) continue;
                                        var font = roomSettings.css.font[i];

                                        if (font.name != null && font.url != null) {
                                            font.toString = function() {
                                                var sources = [];

                                                if (typeof this.url === 'string') {
                                                    sources.push('url("' + this.url + '")');
                                                } else {
                                                    for (var j in this.url) {
                                                        if (!this.url.hasOwnProperty(j)) continue;
                                                        if (['woff', 'woff2', 'opentype', 'svg', 'svgz', 'embedded-opentype', 'truetype'].indexOf(j) > -1) {
                                                            sources.push('url("' + this.url[j] + '") format("' + j + '")');
                                                        }
                                                    }
                                                }

                                                return '@font-face { font-family: "' + this.name + '"; src: ' + sources.join(',') + '; }';
                                            };
                                            roomFonts.push(font.toString());
                                        }
                                    }
                                    Styles.set('room-settings-fonts', roomFonts.join('\n'));
                                }

                                // css.import
                                if (roomSettings.css.import != null && _.isArray(roomSettings.css.import)) {
                                    for (i in roomSettings.css.import) {
                                        if (roomSettings.css.import.hasOwnProperty(i) && typeof roomSettings.css.import[i] === 'string') {
                                            Styles.addImport(roomSettings.css.import[i]);
                                        }
                                    }
                                }

                                // css.setting
                                if (roomSettings.css.rule != null) {
                                    var roomCSSRules = [];

                                    for (i in roomSettings.css.rule) {
                                        if (!roomSettings.css.rule.hasOwnProperty(i)) continue;
                                        var rule = [];

                                        for (var j in roomSettings.css.rule[i]) {
                                            if (!roomSettings.css.rule[i].hasOwnProperty(j)) continue;
                                            rule.push(j + ':' + roomSettings.css.rule[i][j]);
                                        }
                                        roomCSSRules.push(i + ' {' + rule.join(';') + '}');
                                    }
                                    Styles.set('room-settings-rules', roomCSSRules.join('\n'));
                                }
                            }

                            // images
                            if (roomSettings.images != null) {

                                // images.background
                                if (roomSettings.images.background) {
                                    Styles.set('room-settings-background-image', '.room-background { background: url("' + p3Utils.proxifyImage(roomSettings.images.background) + '") !important; }');
                                }

                                // images.playback
                                var playbackBackground = $('#playback').find('.background img');

                                if (playbackBackground.data('_o') == null) {
                                    playbackBackground.data('_o', playbackBackground.attr('src'));
                                }

                                if (roomSettings.images.playback != null) {
                                    if (typeof roomSettings.images.playback === 'string' && roomSettings.images.playback.indexOf('http') === 0) {
                                        var playbackFrame = new Image();

                                        playbackFrame.onload = function() {
                                            playbackBackground.attr('src', this.src);
                                            RoomLoader.frameHeight = this.height - 10;
                                            RoomLoader.frameWidth = this.width - 18;
                                            RoomLoader.onVideoResize(Layout.getSize());
                                        };
                                        playbackFrame.src = p3Utils.proxifyImage(roomSettings.images.playback);
                                    } else if (roomSettings.images.playback === false) {
                                        playbackBackground.hide();
                                    }
                                }

                                // images.booth
                                if (roomSettings.images.booth != null && typeof roomSettings.images.booth === 'string') {
                                    $('#dj-booth').append($('<div id="p3-dj-booth">').css('background-image', 'url("' + p3Utils.proxifyImage(roomSettings.images.booth) + '")'));
                                }

                                // images.icons
                                if (roomSettings.images.icons != null) {
                                    a = {};
                                    for (i in roomSettings.images.icons) {
                                        if (!roomSettings.images.icons.hasOwnProperty(i)) continue;
                                        if (ranks.indexOf(i) > -1 && typeof roomSettings.images.icons[i] === 'string') {
                                            a[i] = p3Utils.proxifyImage(roomSettings.images.icons[i]);
                                        }
                                    }
                                    this.chatIcons = a;
                                }
                            }

                            // text
                            if (roomSettings.text != null) {

                                // text.plugCubed
                                if (roomSettings.text.plugCubed != null) { // eslint-disable-line no-empty
                                }

                                // text.plugDJ
                                if (roomSettings.text.plugDJ != null) {
                                    for (i in roomSettings.text.plugDJ) {
                                        if (!roomSettings.text.plugDJ.hasOwnProperty(i)) continue;
                                        var value = roomSettings.text.plugDJ[i];

                                        if (i && value && typeof value == 'string') {
                                            setPlugDJLang(i, roomSettings.text.plugDJ[i]);
                                        }
                                    }
                                }
                            }
                        }

                        // rules
                        if (roomSettings.rules != null) {
                            this.rules.allowAutowoot = roomSettings.rules.allowAutowoot == null || roomSettings.rules.allowAutowoot === 'true' || roomSettings.rules.allowAutowoot === true;
                            this.rules.allowAutojoin = roomSettings.rules.allowAutojoin == null || roomSettings.rules.allowAutojoin === 'true' || roomSettings.rules.allowAutojoin === true;
                            this.rules.allowAutorespond = roomSettings.rules.allowAutorespond == null || roomSettings.rules.allowAutorespond === 'true' || roomSettings.rules.allowAutorespond === true;
                            this.rules.allowEmotes = roomSettings.rules.allowEmotes == null || roomSettings.rules.allowEmotes === 'true' || roomSettings.rules.allowEmotes === true;
                            this.rules.allowShowingMehs = roomSettings.rules.allowShowingMehs == null || roomSettings.rules.allowShowingMehs === 'true' || roomSettings.rules.allowShowingMehs === true;

                        } else {
                            this.rules.allowAutowoot = true;
                            this.rules.allowAutojoin = true;
                            this.rules.allowAutorespond = true;
                            this.rules.allowEmotes = true;
                            this.rules.allowShowingMehs = true;
                        }

                        // roomscript
                        if (roomSettings.roomscript != null) {

                            // TODO: Make this

                        }

                        // Update autorespond
                        if (Settings.autorespond) {
                            if (this.rules.allowAutorespond) {
                                $('#chat-input-field').attr('disabled', 'disabled').attr('placeholder', p3Lang.i18n('autorespond.disable'));
                            } else {
                                $('#chat-input-field').removeAttr('disabled').attr('placeholder', Lang.chat.placeholder);
                            }
                        }

                        if (showMessage) {
                            p3Utils.chatLog(undefined, (typeof roomSettings.author === 'string' ? p3Lang.i18n('roomSpecificSettings.infoHeaderCredits', p3Utils.cleanHTML(roomSettings.author, '*')) : p3Lang.i18n('roomSpecificSettings.infoHeader')) + '<br>' + p3Lang.i18n('roomSpecificSettings.infoDisable'), p3Utils.logColors.infoMessage2, -1);
                            showMessage = false;
                        }

                        require('plugCubed/CustomChatColors').update();

                        // Redraw menu
                        require('plugCubed/dialogs/Menu').createMenu();
                    }
                },
                clear: function() {
                    this.chatColors = {};
                    this.chatIcons = {};

                    for (var i in langKeys) {
                        if (!langKeys.hasOwnProperty(i)) continue;
                        var key = langKeys[i];

                        setPlugDJLang(key, getPlugDJLang(key, true));
                    }

                    $('#p3-dj-booth').remove();

                    Styles.unset(['room-settings-background-color', 'room-settings-background-image', 'room-settings-booth', 'room-settings-fonts', 'room-settings-rules', 'room-settings-maingui', 'CCC-text-admin', 'CCC-text-ambassador', 'CCC-text-host', 'CCC-text-cohost', 'CCC-text-manager', 'CCC-text-bouncer', 'CCC-text-residentdj', 'CCC-text-regular', 'CCC-text-you', 'CCC-image-admin', 'CCC-image-ambassador', 'CCC-image-host', 'CCC-image-cohost', 'CCC-image-manager', 'CCC-image-bouncer', 'CCC-image-residentdj']);
                    Styles.clearImports();
                    var playbackBackground = $('#playback').find('.background img');

                    playbackBackground.data('_o', PlugUI.videoframe);
                    playbackBackground.attr('src', playbackBackground.data('_o'));
                    playbackBackground.show();
                    RoomLoader.frameHeight = 274;
                    RoomLoader.frameWidth = 490;
                    RoomLoader.onVideoResize(Layout.getSize());
                },
                close: function() {
                    Context.off('change:role', setFooterIcon);
                    Context.off('room:joining', this.clear, this);
                    Context.off('room:joined', this.update, this);
                    this.clear();
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/UserMeh', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications', 'plugCubed/RoomSettings'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications, RoomSettings) {
            var CurrentUser = window.plugCubedModules.CurrentUser;
            var Handler = TriggerHandler.extend({
                trigger: API.VOTE_UPDATE,
                handler: function(data) {
                    var isStaff = (CurrentUser.hasPermission(API.ROLE.BOUNCER) || CurrentUser.hasPermission(API.ROLE.BOUNCER, true) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador());

                    if (data.vote < 0 && (((Settings.notify & enumNotifications.USER_MEH) === enumNotifications.USER_MEH) && (isStaff || (!isStaff && RoomSettings.rules.allowShowingMehs)))) {
                        p3Utils.chatLog(undefined, p3Lang.i18n('notify.message.meh'), Settings.colors.meh || Settings.colorInfo.notifications.meh.color, data.user.id);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/SongUnavailable', ['jquery', 'plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function($, TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: API.ADVANCE,
                handler: function(data) {

                    // TODO: Fix for new YouTube / SoundCloud APIs
                    return;

                    // if ((Settings.notify & enumNotifications.SONG_UNAVAILABLE) === enumNotifications.SONG_UNAVAILABLE) {
                    // }
                }
            });

            return new Handler();
        });

        define('plugCubed/notifications/BoothAlert', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/enums/Notifications'], function(TriggerHandler, Settings, p3Utils, p3Lang, enumNotifications) {
            var Handler = TriggerHandler.extend({
                trigger: {
                    advance: 'boothAlert',
                    waitListUpdate: 'boothAlert'
                },
                hasNotified: false,
                boothAlert: function(data) {
                    if ((Settings.notify & enumNotifications.BOOTH_ALERT) === enumNotifications.BOOTH_ALERT && API.getWaitListPosition() + 1 === Settings.boothAlert) {
                        if (!this.hasNotified) {
                            this.hasNotified = true;
                            setTimeout(function() {
                                var pos = API.getWaitListPosition() + 1;

                                p3Utils.playMentionSound();
                                p3Utils.chatLog(undefined, p3Lang.i18n((pos === 1 ? 'notify.message.boothAlertNext' : 'notify.message.boothAlertPos'), p3Utils.getOrdinal(Settings.boothAlert)), Settings.colors.boothAlert || Settings.colorInfo.notifications.boothAlert.color, -4);
                            }, 3000);
                        } else {
                            this.hasNotified = false;
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/Notifications', ['plugCubed/Class', 'plugCubed/notifications/History', 'plugCubed/notifications/SongLength', 'plugCubed/notifications/SongStats', 'plugCubed/notifications/SongUpdate', 'plugCubed/notifications/UserGrab', 'plugCubed/notifications/UserJoin', 'plugCubed/notifications/UserLeave', 'plugCubed/notifications/UserMeh', 'plugCubed/notifications/History', 'plugCubed/notifications/SongUnavailable', 'plugCubed/notifications/BoothAlert'], function() {
            var modules, Class, Handler;

            modules = _.toArray(arguments);
            Class = modules.shift();

            Handler = Class.extend({
                register: function() {
                    this.unregister();
                    for (var i = 0; i < modules.length; i++) {
                        if (!modules[i].registered) {
                            modules[i].register();
                        }
                    }
                },
                unregister: function() {
                    for (var i = 0; i < modules.length; i++) {
                        if (modules[i].registered) {
                            modules[i].close();
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/Slider', ['jquery', 'plugCubed/Class'], function($, Class) {
            return Class.extend({
                init: function(min, max, val, callback) {
                    this.min = min ? min : 0;
                    this.max = max ? max : 100;
                    this.value = val ? val : this.min;
                    this.cb = callback;

                    this.startBind = $.proxy(this.onStart, this);
                    this.moveBind = $.proxy(this.onUpdate, this);
                    this.stopBind = $.proxy(this.onStop, this);
                    this.clickBind = $.proxy(this.onClick, this);

                    this.$slider = $('<div class="p3slider"><div class="line"></div><div class="circle"></div><div class="hit"></div></div>');
                    this.$line = this.$slider.find('.line');
                    this.$hit = this.$slider.find('.hit');
                    this.$circle = this.$slider.find('.circle');

                    this.$hit.mousedown(this.startBind);

                    this._max = this.$hit.width() - this.$circle.width();
                    this.onChange();

                    return this;
                },
                onStart: function(event) {
                    this._min = this.$hit.offset().left;
                    this._max = this.$hit.width() - this.$circle.width();
                    $(document).on('mouseup', this.stopBind).on('mousemove', this.moveBind);

                    return this.onUpdate(event);
                },
                onUpdate: function(event) {
                    this.value = Math.max(this.min, Math.min(this.max, ~~((this.max - this.min) * ((event.pageX - this._min) / this._max)) + this.min));
                    this.onChange();
                    event.preventDefault();
                    event.stopPropagation();

                    return false;
                },
                onStop: function(event) {
                    $(document).off('mouseup', this.stopBind).off('mousemove', this.moveBind);
                    event.preventDefault();
                    event.stopPropagation();

                    return false;
                },
                onChange: function() {
                    this.$circle.css('left', this.$hit.position().left + (this.$line.width() || 85) * ((this.value - this.min) / (this.max - this.min)) - this.$circle.width() / 2);
                    if (typeof this.cb === 'function') this.cb(this.value);
                }
            });
        });

        define('plugCubed/CustomChatColors', ['jquery', 'plugCubed/Class', 'plugCubed/RoomSettings', 'plugCubed/StyleManager', 'plugCubed/Settings', 'plugCubed/Utils'], function($, Class, RoomSettings, Styles, Settings, p3Utils) {
            var Handler = Class.extend({
                clear: function() {
                    Styles.unset(['CCC-text-admin', 'CCC-text-ambassador', 'CCC-text-host', 'CCC-text-cohost', 'CCC-text-manager', 'CCC-text-bouncer', 'CCC-text-residentdj', 'CCC-text-regular', 'CCC-text-you', 'CCC-image-admin', 'CCC-image-ambassador', 'CCC-image-host', 'CCC-image-cohost', 'CCC-image-manager', 'CCC-image-bouncer', 'CCC-image-residentdj']);
                },
                update: function() {
                    var useRoomSettings = Settings.useRoomSettings[p3Utils.getRoomID()];

                    useRoomSettings = !!(useRoomSettings == null || useRoomSettings === true);

                    this.clear();

                    if ((useRoomSettings && RoomSettings.chatColors.admin) || Settings.colors.admin !== Settings.colorInfo.ranks.admin.color) {
                        Styles.set('CCC-text-admin', ['#user-rollover .rank-admin .username', '#user-lists .user > .icon-chat-admin + .name', '#footer-user .info .name .icon-chat-admin + span', '#waitlist .icon-chat-admin + span', '.from-admin .un { color:' + p3Utils.toRGB(Settings.colors.admin !== Settings.colorInfo.ranks.admin.color ? Settings.colors.admin : RoomSettings.chatColors.admin) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.ambassador) || Settings.colors.ambassador !== Settings.colorInfo.ranks.ambassador.color) {
                        Styles.set('CCC-text-ambassador', ['#user-rollover .rank-ambassador .username', '#user-lists .user > .icon-chat-ambassador + .name', '#footer-user .info .name .icon-chat-ambassador + span', '#waitlist .icon-chat-ambassador + span', '.from-ambassador .un { color:' + p3Utils.toRGB(Settings.colors.ambassador !== Settings.colorInfo.ranks.ambassador.color ? Settings.colors.ambassador : RoomSettings.chatColors.ambassador) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.host) || Settings.colors.host !== Settings.colorInfo.ranks.host.color) {
                        Styles.set('CCC-text-host', ['#user-rollover .rank-host .username', '#user-lists .user > .icon-chat-host + .name', '#footer-user .info .name .icon-chat-host + span', '#waitlist .icon-chat-host + span', '.from-host .un { color:' + p3Utils.toRGB(Settings.colors.host !== Settings.colorInfo.ranks.host.color ? Settings.colors.host : RoomSettings.chatColors.host) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.cohost) || Settings.colors.cohost !== Settings.colorInfo.ranks.cohost.color) {
                        Styles.set('CCC-text-cohost', ['#user-rollover .rank-cohost .username', '#user-lists .user > .icon-chat-cohost + .name', '#footer-user .info .name .icon-chat-cohost + span', '#waitlist .icon-chat-cohost + span', '.from-cohost .un', '.cohost { color:' + p3Utils.toRGB(Settings.colors.cohost !== Settings.colorInfo.ranks.cohost.color ? Settings.colors.cohost : RoomSettings.chatColors.cohost) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.manager) || Settings.colors.manager !== Settings.colorInfo.ranks.manager.color) {
                        Styles.set('CCC-text-manager', ['#user-rollover .rank-manager .username', '#user-lists .user > .icon-chat-manager + .name', '#footer-user .info .name .icon-chat-manager + span', '#waitlist .icon-chat-manager + span', '.from-manager .un { color:' + p3Utils.toRGB(Settings.colors.manager !== Settings.colorInfo.ranks.manager.color ? Settings.colors.manager : RoomSettings.chatColors.manager) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.bouncer) || Settings.colors.bouncer !== Settings.colorInfo.ranks.bouncer.color) {
                        Styles.set('CCC-text-bouncer', ['#user-rollover .rank-bouncer .username', '#user-lists .user > .icon-chat-bouncer + .name', '#footer-user .info .name .icon-chat-bouncer + span', '#waitlist .icon-chat-bouncer + span', '.from-bouncer .un { color:' + p3Utils.toRGB(Settings.colors.bouncer !== Settings.colorInfo.ranks.bouncer.color ? Settings.colors.bouncer : RoomSettings.chatColors.bouncer) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.residentdj) || Settings.colors.residentdj !== Settings.colorInfo.ranks.residentdj.color) {
                        Styles.set('CCC-text-residentdj', ['#user-rollover .rank-residentdj .username', '#user-lists .user > .icon-chat-dj + .name', '#footer-user .info .name .icon-chat-dj + span', '#waitlist .icon-chat-dj + span', '.from-dj .un { color:' + p3Utils.toRGB(Settings.colors.residentdj !== Settings.colorInfo.ranks.residentdj.color ? Settings.colors.residentdj : RoomSettings.chatColors.residentdj) + '!important; }'].join(',\n'));
                    }
                    if ((useRoomSettings && RoomSettings.chatColors.regular) || Settings.colors.regular !== Settings.colorInfo.ranks.regular.color) {
                        Styles.set('CCC-text-regular', ['#user-rollover .rank-regular .username', '#user-lists .user > .name:first-child', '.from-regular .un { color:' + p3Utils.toRGB(Settings.colors.regular !== Settings.colorInfo.ranks.regular.color ? Settings.colors.regular : RoomSettings.chatColors.regular) + '!important; }'].join(',\n'));
                    }
                    if (Settings.colors.you !== Settings.colorInfo.ranks.you.color) {
                        Styles.set('CCC-text-you', ['#user-rollover.is-you .username', '#user-lists .list .user.is-you .name', '.from-you .un { color:' + p3Utils.toRGB(Settings.colors.you) + '!important; }'].join(',\n'));
                    }
                    if (useRoomSettings) {
                        if (RoomSettings.chatIcons.admin) {
                            Styles.set('CCC-image-admin', ['.icon-chat-admin { background-image: url("' + RoomSettings.chatIcons.admin + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.ambassador) {
                            Styles.set('CCC-image-ambassador', ['.icon-chat-ambassador { background-image: url("' + RoomSettings.chatIcons.ambassador + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.host) {
                            Styles.set('CCC-image-host', ['.icon-chat-host { background-image: url("' + RoomSettings.chatIcons.host + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.cohost) {
                            Styles.set('CCC-image-cohost', ['.icon-chat-cohost { background-image: url("' + RoomSettings.chatIcons.cohost + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.manager) {
                            Styles.set('CCC-image-manager', ['.icon-chat-manager { background-image: url("' + RoomSettings.chatIcons.manager + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.bouncer) {
                            Styles.set('CCC-image-bouncer', ['.icon-chat-bouncer { background-image: url("' + RoomSettings.chatIcons.bouncer + '"); background-position: 0 0; }'].join(',\n'));
                        }
                        if (RoomSettings.chatIcons.residentdj) {
                            Styles.set('CCC-image-residentdj', ['.icon-chat-dj { background-image: url("' + RoomSettings.chatIcons.residentdj + '"); background-position: 0 0; }'].join(',\n'));
                        }
                    }
                }
            });

            return new Handler();
        });


        define('plugCubed/dialogs/CustomChatColors', ['jquery', 'plugCubed/Class', 'plugCubed/Lang', 'plugCubed/CustomChatColors', 'plugCubed/Settings', 'plugCubed/Utils'], function($, Class, p3Lang, CCC, Settings, p3Utils) {
            var Context = window.plugCubedModules.context;

            function guiInput(id, text, defaultColor) {
                if (!Settings.colors[id]) {
                    Settings.colors[id] = defaultColor;
                }

                return $('<div class="item">').addClass('p3-s-cc-' + id).append($('<span>').text(text)).append($('<span>').addClass('default').css('display', (p3Utils.equalsIgnoreCase(Settings.colors[id], defaultColor) ? 'none' : 'block')).mouseover(function() {
                    Context.trigger('tooltip:show', p3Lang.i18n('tooltip.reset'), $(this), false);
                }).mouseout(function() {
                    Context.trigger('tooltip:hide');
                }).click(function() {
                    $(this).parent().find('input').val(defaultColor);
                    $(this).parent().find('.example').css('background-color', p3Utils.toRGB(defaultColor));
                    $(this).css('display', 'none');
                    Settings.colors[id] = defaultColor;
                    Settings.save();
                    CCC.update();
                })).append($('<span>').addClass('example').css('background-color', p3Utils.toRGB(Settings.colors[id]))).append($('<input>').val(Settings.colors[id]).keyup(function() {
                    if (p3Utils.isRGB($(this).val())) {
                        $(this).parent().find('.example').css('background-color', p3Utils.toRGB($(this).val()));
                        Settings.colors[id] = $(this).val();
                        Settings.save();
                        CCC.update();
                    }
                    $(this).parent().find('.default').css('display', (p3Utils.equalsIgnoreCase($(this).val(), defaultColor) ? 'none' : 'block'));
                }));
            }

            var div;

            var A = Class.extend({
                render: function() {
                    var i;
                    var $settings = $('#p3-settings');

                    if (div != null) {
                        if (div.css('left') === '-500px') {
                            div.animate({
                                left: $settings.width() + 1
                            });

                            return;
                        }
                        div.animate({
                            left: -div.width() - 2
                        }, {
                            complete: function() {
                                if (div) {
                                    div.detach();
                                    div = undefined;
                                }
                            }
                        });

                        return;
                    }
                    var container = $('<div class="container">').append($('<div class="section">').text('User Ranks'));

                    for (i in Settings.colorInfo.ranks) {
                        if (Settings.colorInfo.ranks.hasOwnProperty(i)) {
                            container.append(guiInput(i, p3Lang.i18n(Settings.colorInfo.ranks[i].title), Settings.colorInfo.ranks[i].color));
                        }
                    }
                    container.append($('<div class="spacer">').append($('<div class="divider">'))).append($('<div class="section">').text(p3Lang.i18n('notify.header')));
                    for (i in Settings.colorInfo.notifications) {
                        if (Settings.colorInfo.notifications.hasOwnProperty(i)) {
                            if (i === 'songLength') {
                                if (API.hasPermission(undefined, API.ROLE.BOUNCER) || p3Utils.isPlugCubedDeveloper()) {
                                    container.append(guiInput(i, p3Lang.i18n(Settings.colorInfo.notifications[i].title, Settings.notifySongLength), Settings.colorInfo.notifications[i].color));
                                }
                            } else if (i === 'boothAlert') {
                                container.append(guiInput(i, p3Lang.i18n(Settings.colorInfo.notifications[i].title, Settings.boothAlert), Settings.colorInfo.notifications[i].color));
                            } else {
                                container.append(guiInput(i, p3Lang.i18n(Settings.colorInfo.notifications[i].title), Settings.colorInfo.notifications[i].color));
                            }
                        }
                    }
                    div = $('<div id="p3-settings-custom-colors" style="left: -500px;">').append($('<div class="header">').append($('<div class="back">').append($('<i class="icon icon-arrow-left"></i>')).click(function() {
                        if (div != null) {
                            div.animate({
                                left: -div.width() - 2
                            }, {
                                complete: function() {
                                    if (div) {
                                        div.detach();
                                        div = undefined;
                                    }
                                }
                            });
                        }
                    })).append($('<div class="title">').append($('<span>').text(p3Lang.i18n('menu.customchatcolors'))))).append(container).animate({
                        left: $settings.width() + 1
                    });
                    $('#p3-settings-wrapper').append(div);
                },
                hide: function() {
                    if (div != null) {
                        div.animate({
                            left: -div.width() - 2
                        }, {
                            complete: function() {
                                if (div) {
                                    div.detach();
                                    div = undefined;
                                }
                            }
                        });
                    }
                }
            });

            return new A();
        });

        define('plugCubed/dialogs/ControlPanel', ['jquery', 'underscore', 'plugCubed/Class'], function($, _, Class) {

            var ControlPanelClass, JQueryElementClass, PanelClass, ButtonClass, InputClass, $controlPanelDiv, $topBarDiv, $menuDiv, $currentDiv, $closeDiv, scrollPane, shownHeight,
                that1, that2, _onResize, _onTabClick;
            var tabs = {};

            JQueryElementClass = Class.extend({
                getJQueryElement: function() {
                    console.error('Missing getJQueryElement');

                    return null;
                }
            });

            ButtonClass = JQueryElementClass.extend({
                init: function(label, submit) {
                    that1 = this;
                    this.$div = $('<div>').addClass('button').text(label);
                    if (submit) {
                        this.$div.addClass('submit');
                    }
                    this.$div.click(function() {
                        that1.onClick();
                    });

                    return this;
                },
                changeLabel: function(label) {
                    this.$div.text(label);

                    return this;
                },
                changeSubmit: function(submit) {
                    this.$div.removeClass('submit');
                    if (submit) {
                        this.$div.addClass('submit');
                    }

                    return this;
                },
                onClick: function() {
                    console.error('Missing onClick');
                },
                getJQueryElement: function() {
                    return this.$div;
                }
            });

            InputClass = JQueryElementClass.extend({
                init: function(type, label, placeholder) {
                    this.$div = $('<div>').addClass('input-group');
                    if (label) {
                        this.$label = $('<div>').addClass('label').text(label);
                    }
                    this.$input = $('<input>').attr({
                        type: type,
                        placeholder: placeholder
                    });

                    if (label) {
                        this.$div.append(this.$label);
                    }
                    this.$div.append(this.$input);
                },
                changeLabel: function(label) {
                    this.$div.text(label);

                    return this;
                },
                changeSubmit: function(submit) {
                    this.$div.removeClass('submit');
                    if (submit) {
                        this.$div.addClass('submit');
                    }

                    return this;
                },
                change: function(onChangeFunc) {
                    if (typeof onChangeFunc == 'function') {
                        this.$div.change(onChangeFunc);
                    }

                    return this;
                },
                getJQueryElement: function() {
                    return this.$div;
                }
            });

            PanelClass = Class.extend({
                init: function(name) {
                    this._content = [];
                    this.name = name;
                },
                addContent: function(content) {
                    if (content instanceof $) {
                        this._content.push(content);
                    }
                },
                print: function() {
                    for (var i in this._content) {
                        if (!this._content.hasOwnProperty(i)) continue;
                        var $content = this._content[i];

                        if ($content instanceof JQueryElementClass) {
                            $content = $content.getJQueryElement();
                        }
                        scrollPane.getContentPane().append($content);
                    }
                }
            });

            ControlPanelClass = Class.extend({
                init: function() {
                    that2 = this;
                    _onResize = _.bind(this.onResize, this);
                    _onTabClick = _.bind(this.onTabClick, this);

                    $(window).resize(_onResize);

                    this.shown = false;
                },
                close: function() {
                    $(window).off('resize', _onResize);
                    if ($controlPanelDiv != null) {
                        $controlPanelDiv.remove();
                    }
                },
                createControlPanel: function(onlyRecreate) {
                    if ($controlPanelDiv != null) {
                        $controlPanelDiv.remove();
                    } else if (onlyRecreate) return;
                    $controlPanelDiv = $('<div>').attr('id', 'p3-control-panel');

                    $menuDiv = $('<div>').attr('id', 'p3-control-panel-menu');

                    for (var i in tabs) {
                        if (tabs.hasOwnProperty(i)) {
                            $menuDiv.append($('<div>').addClass('p3-control-panel-menu-tab tab-' + i).data('id', i).text(i).click(_onTabClick));
                        }
                    }

                    $topBarDiv = $('<div>').attr('id', 'p3-control-panel-top').append($('<span>').text('Control Panel'));

                    $controlPanelDiv.append($topBarDiv).append($menuDiv);

                    $currentDiv = $('<div>').attr('id', 'p3-control-panel-current');

                    $controlPanelDiv.append($currentDiv);

                    $closeDiv = $('<div>').attr('id', 'p3-control-panel-close').append('<i class="icon icon-arrow-down"></i>').click(function() {
                        that2.toggleControlPanel(false);
                    });

                    $controlPanelDiv.append($closeDiv);

                    $('body').append($controlPanelDiv);
                    this.onResize();
                },

                /**
                 * Create an input field
                 * @param {string} type Type of input field
                 * @param {undefined|string} [label] Label for input field
                 * @param {undefined|string} [placeholder] Placeholder
                 * @returns {*|jQuery} Returns new input field class
                 */
                inputField: function(type, label, placeholder) {
                    return new InputClass(type, label, placeholder);
                },

                /**
                 * @callback onButtonClick
                 * @param {object}
                 */
                /**
                 * Create a button
                 * @param {string} label Label for button
                 * @param {boolean} submit Adds submit class to button
                 * @param {onButtonClick} onClick Function handler for onclick
                 * @returns {*|jQuery} Returns new button class
                 */
                button: function(label, submit, onClick) {
                    var newButton = new ButtonClass(label, submit);

                    if (typeof onClick === 'function') {
                        newButton.onClick = onClick;
                    }

                    return newButton;
                },
                onResize: function() {
                    if ($controlPanelDiv == null) return;
                    var $panel = $('#playlist-panel');

                    shownHeight = $(window).height() - 150;
                    $controlPanelDiv.css({
                        width: $panel.width(),
                        height: this.shown ? shownHeight : 0,
                        'z-index': 50
                    });

                    $currentDiv.css({
                        width: $panel.width() - 256 - 20,
                        height: this.shown ? shownHeight - $topBarDiv.height() - 20 : 0
                    });

                    if (this.shown && scrollPane) {
                        scrollPane.reinitialise();
                    }
                },
                toggleControlPanel: function(shown) {
                    if ($controlPanelDiv == null) {
                        if (shown != null && !shown) return;
                        this.createControlPanel();
                    }
                    this.shown = shown != null ? shown : !this.shown;
                    shownHeight = $(window).height() - 150;
                    $controlPanelDiv.animate({
                        height: this.shown ? shownHeight : 0
                    }, {
                        duration: 350,
                        easing: 'easeInOutExpo',
                        complete: function() {
                            if (!that2.shown && scrollPane != null) {
                                $controlPanelDiv.detach();
                                $controlPanelDiv = null;
                                scrollPane.destroy();
                                scrollPane = null;
                            }
                        }
                    });
                },
                onTabClick: function(e) {
                    this.openTab($(e.currentTarget).data('id'));
                },
                openTab: function(id) {
                    this.toggleControlPanel(true);
                    var tab = tabs[id];

                    if (tab == null || !(tab instanceof PanelClass)) return;

                    $menuDiv.find('.current').removeClass('current');
                    $('.p3-control-panel-menu-tab.tab-' + id).addClass('current');

                    if (scrollPane == null) {
                        $currentDiv.jScrollPane({
                            showArrows: true
                        });
                        scrollPane = $currentDiv.data('jsp');
                    }

                    scrollPane.getContentPane().html('');
                    tab.print();

                    this.onResize();
                },

                /**
                 * Add a new tab, if it doesn't already exists
                 * @param {string} name Name of tab
                 * @returns {PanelClass} Returns new tab
                 */
                addPanel: function(name) {
                    name = name.trim();
                    if (tabs[name] != null) return null;
                    tabs[name] = new PanelClass(name);
                    this.createControlPanel(true);

                    return tabs[name];
                },

                /**
                 * Remove a tab, if tab exists
                 * @param {PanelClass} panel Name of tab
                 * @returns {Boolean} Returns true for deleted, false if panel not defined
                 */
                removePanel: function(panel) {
                    if (!(panel instanceof PanelClass) || tabs[panel.name] == null) return false;
                    delete tabs[panel.name];
                    this.createControlPanel(true);

                    return true;
                }
            });

            return new ControlPanelClass();
        });

        define('plugCubed/handlers/ChatHandler', ['jquery', 'plugCubed/Class', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/Settings', 'plugCubed/RoomSettings'], function($, Class, p3Utils, p3Lang, Settings, RoomSettings) {

            var twitchEmoteTemplate = '';
            var twitchEmotes = [];
            var Context = window.plugCubedModules.context;
            var PopoutView = window.plugCubedModules.PopoutView;

            $('#chat-messages').on('mouseover', '.twitch-emote', function() {
                Context.trigger('tooltip:show', $(this).data('emote'), $(this), true);
            }).on('mouseout', '.twitch-emote', function() {
                Context.trigger('tooltip:hide');
            });

            function convertImageLinks(text, $message) {
                if (Settings.chatImages) {
                    if (text.toLowerCase().indexOf('nsfw') < 0) {
                        var temp = $('<div/>');

                        temp.html(text).find('a').each(function() {
                            var path, $video, identifier;
                            var imageURL = null;
                            var url = $(this).attr('href');

                            // Prevent plug.dj exploits
                            if (p3Utils.startsWithIgnoreCase(url, ['http://plug.dj', 'https://plug.dj'])) {
                                return;

                                // Normal image links
                            } else if (p3Utils.endsWithIgnoreCase(url, ['.gif', '.jpg', '.jpeg', '.png']) || p3Utils.endsWithIgnoreCase(p3Utils.getBaseURL(url), ['.gif', '.jpg', '.jpeg', '.png'])) {
                                imageURL = p3Utils.proxifyImage(url);

                                // gfycat links
                            } else if (p3Utils.startsWithIgnoreCase(url, ['http://gfycat.com/', 'https://gfycat.com/'])) {
                                path = url.split('/');
                                if (path.length > 3) {
                                    path = path[3];
                                    if (path.trim().length !== 0) {
                                        identifier = 'video-' + p3Utils.getRandomString(8);

                                        $video = $('<video autoplay loop muted="muted">').addClass(identifier).css('display', 'block').css('max-width', '100%').css('height', 'auto').css('margin', '0 auto');

                                        $(this).html('').append($video);

                                        $.getJSON('https://gfycat.com/cajax/get/' + path, function(videoData) {
                                            $video = $message.find('.' + identifier);

                                            if (videoData.error) {
                                                console.log('error', videoData);
                                                $video.html(videoData.error);

                                                return;
                                            }

                                            var webmUrl, mp4Url, imgUrl;

                                            webmUrl = p3Utils.httpsifyURL(videoData.gfyItem.webmUrl);
                                            mp4Url = p3Utils.httpsifyURL(videoData.gfyItem.mp4Url);
                                            imgUrl = p3Utils.httpsifyURL(videoData.gfyItem.gifUrl);

                                            $video.append($('<source>').attr('type', 'video/webm').attr('src', webmUrl));
                                            $video.append($('<source>').attr('type', 'video/mp4').attr('src', mp4Url));
                                            $video.append($('<img>').attr('src', imgUrl));
                                        });
                                    }
                                }

                                // Lightshot links
                            } else if (p3Utils.startsWithIgnoreCase(url, ['http://prntscr.com/', 'https://prntscr.com/'])) {
                                path = url.split('/');
                                if (path.length > 3) {
                                    path = path[3];
                                    if (path.trim().length !== 0) {
                                        imageURL = 'https://api.plugCubed.net/redirect/prntscr/' + path;
                                    }
                                }

                                // Imgur links
                            } else if (p3Utils.startsWithIgnoreCase(url, ['http://imgur.com/gallery/', 'https://imgur.com/gallery/', 'http://imgur.com/', 'http://i.imgur.com/', 'https://i.imgur.com/', 'https://imgur.com/'])) {
                                path = url.split('/');
                                if (path.length >= 4) {
                                    path = path[4] || path[3];
                                    if (path && path.trim().length !== 0) {
                                        identifier = 'video-' + p3Utils.getRandomString(8);

                                        $video = $('<video autoplay loop muted="muted">').addClass(identifier).css('display', 'block').css('max-width', '100%').css('height', 'auto').css('margin', '0 auto');

                                        $(this).html('').append($video);

                                        $.getJSON('https://api.plugcubed.net/redirect/imgurraw/' + path, function(imgurData) {
                                            $video = $message.find('.' + identifier);

                                            if (imgurData.error) {
                                                console.log('error', imgurData);
                                                $video.html(imgurData.error);

                                                return;
                                            }

                                            if (imgurData.webm != null) $video.append($('<source>').attr('type', 'video/webm').attr('src', p3Utils.httpsifyURL(imgurData.webm)));

                                            if (imgurData.mp4 != null) $video.append($('<source>').attr('type', 'video/mp4').attr('src', p3Utils.httpsifyURL(imgurData.mp4)));

                                            if (imgurData.gifv != null) $video.append($('<source>').attr('type', 'video/mp4').attr('src', p3Utils.httpsifyURL(imgurData.gifv)));

                                            $video.attr('poster', p3Utils.httpsifyURL(imgurData.link));
                                            $video.append($('<img>').attr('src', p3Utils.httpsifyURL(imgurData.link)));
                                        });
                                    }
                                }

                                // Gyazo links
                            } else if (p3Utils.startsWithIgnoreCase(url, ['http://gyazo.com/', 'https://gyazo.com/'])) {
                                path = url.split('/');
                                if (path.length > 3) {
                                    path = path[3];
                                    if (path.trim().length !== 0) {
                                        imageURL = 'https://api.plugcubed.net/redirect/gyazo/' + path;
                                    }
                                }
                            } else {

                                // DeviantArt links
                                var daTests = [/http:\/\/[a-z\-\.]+\.deviantart.com\/art\/[0-9a-zA-Z:\-]+/, /http:\/\/[a-z\-\.]+\.deviantart.com\/[0-9a-zA-Z:\-]+#\/[0-9a-zA-Z:\-]+/, /http:\/\/fav.me\/[0-9a-zA-Z]+/, /http:\/\/sta.sh\/[0-9a-zA-Z]+/];

                                for (var i in daTests) {
                                    if (daTests.hasOwnProperty(i) && daTests[i].test(url)) {
                                        imageURL = 'https://api.plugCubed.net/redirect/da/' + url;
                                        break;
                                    }
                                }
                            }

                            // If supported image link
                            if (imageURL !== null) {
                                var image = $('<img>').attr('src', imageURL).css('display', 'block').css('max-width', '100%').css('height', 'auto').css('margin', '0 auto');

                                $(this).html(image);
                            }
                        });
                        text = temp.html();
                    }
                }

                return text;
            }

            function convertEmotes(text) {
                if (Settings.twitchEmotes && RoomSettings.rules.allowEmotes !== false) {
                    var nbspStart = p3Utils.startsWithIgnoreCase(text, '&nbsp;');

                    text = ' ' + (nbspStart ? text.replace('&nbsp;', '') : text) + ' ';

                    for (var i in twitchEmotes) {
                        if (!twitchEmotes.hasOwnProperty(i)) continue;
                        var twitchEmote = twitchEmotes[i];
                        var temp = $('<div>');
                        var image = $('<img>').addClass('p3-twitch-emote').attr('src', twitchEmoteTemplate.split('{image_id}').join(twitchEmote.image_id)).data('emote', $('<span>').html(twitchEmote.emote).text());

                        temp.append(image);
                        text = text.replace(new RegExp('(:' + twitchEmote.emote + ':)', 'gi'), temp.html());

                    }

                    return (nbspStart ? '&nbsp;' : '') + text.substr(1, text.length - 2);
                }

                return text;
            }

            function onChatReceived(data) {
                if (!data.uid) return;

                data.un = p3Utils.cleanHTML(data.un, '*');
                data.message = p3Utils.cleanHTML(data.message, ['div', 'table', 'tr', 'td']);
            }

            function onChatReceivedLate(data) {
                if (!data.uid) return;

                var $this = $('.msg.cid-' + data.cid).closest('.cm');
                var $msg = $('.msg .text.cid-' + data.cid);
                var $icon;

                var previousMessages = '';
                var innerHTML = $msg.html();

                if (innerHTML != null && innerHTML.indexOf('<br>') > -1) {
                    previousMessages = innerHTML.substr(0, innerHTML.lastIndexOf('<br>') + 4);
                }

                if (Settings.moderation.inlineUserInfo && (p3Utils.hasPermission(undefined, API.ROLE.BOUNCER) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador()) && $this.find('.p3-user-info').length === 0) {
                    var $userInfo = $('<span>').addClass('p3-user-info');

                    $userInfo.html('<strong>LVL:</strong> ' + API.getUser(data.uid).level + ' <strong>|</strong><strong>ID:</strong> ' + API.getUser(data.uid).id);
                    $userInfo.insertAfter($this.find('.un'));
                }

                var msgClass = $this.attr('class');

                msgClass += ' fromID-' + data.uid;

                if (p3Utils.havePlugCubedRank(data.uid)) {
                    msgClass += ' is-p3' + p3Utils.getHighestRank(data.uid);
                }

                msgClass += ' from-';
                if (p3Utils.hasPermission(data.uid, API.ROLE.HOST, true)) {
                    msgClass += 'admin';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.BOUNCER, true)) {
                    msgClass += 'ambassador';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.HOST)) {
                    msgClass += 'host';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.COHOST)) {
                    $this.find('.icon-chat-host').attr('class', 'icon icon-chat-cohost');
                    msgClass += 'cohost';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.MANAGER)) {
                    msgClass += 'manager';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.BOUNCER)) {
                    msgClass += 'bouncer';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.DJ)) {
                    msgClass += 'dj';
                } else if (p3Utils.hasPermission(data.uid, API.ROLE.NONE)) {
                    msgClass += 'regular';
                }

                if (data.uid === API.getUser().id) {
                    msgClass += ' from-you';
                }
                data.message = convertImageLinks(data.message, $msg);
                data.message = convertEmotes(data.message);

                if (p3Utils.havePlugCubedRank(data.uid) || p3Utils.hasPermission(data.uid, API.ROLE.DJ)) {
                    var p3Rank = p3Utils.getHighestRank(data.uid);
                    var specialIconInfo = p3Utils.getPlugCubedSpecial(data.uid);

                    if (p3Rank != null) {

                        $icon = $('<i>').addClass('icon icon-chat-p3' + p3Rank).prependTo($this.find('.from'));

                        $icon.mouseover(function() {
                            Context.trigger('tooltip:show', $('<span>').html(p3Utils.getAllPlugCubedRanks(data.uid)).text(), $(this), true);
                        }).mouseout(function() {
                            Context.trigger('tooltip:hide');
                        });

                        if (specialIconInfo != null) {
                            $icon.css('background-image', 'url("https://plugcubed.net/scripts/release/images/icons.p3special."' + specialIconInfo.icon + '.png)');
                        }
                    }
                }

                $this.attr('class', msgClass);

                // Delete own chat if Bouncer or above
                if ((p3Utils.hasPermission(data.uid, API.ROLE.BOUNCER, true) || p3Utils.hasPermission(data.uid, API.ROLE.BOUNCER)) && data.uid === API.getUser().id) {
                    var deleteButton = $('<div>').addClass('delete-button').text('Delete');

                    deleteButton.click(function() {
                        return API.moderateDeleteChat($this.data('cid'));
                    });
                    if ($this.hasClass('deletable')) return;

                    $this
                        .addClass('deletable')
                        .append(deleteButton);
                }

                $msg.html(previousMessages + p3Utils.cleanHTML(data.message, ['div', 'table', 'tr', 'td'], ['img', 'video', 'source']));

                $this.data('translated', false);
                $this.dblclick(function(e) {
                    if (!e.ctrlKey) return;
                    if ($this.data('translated')) {
                        $msg.html(previousMessages + convertEmotes(convertImageLinks(data.message)));
                        $this.data('translated', false);
                    } else {
                        $msg.html('<em>Translating...</em>');
                        $.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D%22http%3A%2F%2Ftranslate.google.com%2Ftranslate_a%2Ft%3Fclient%3Dp3%26sl%3Dauto%26tl%3D' + API.getUser().language + '%26ie%3DUTF-8%26oe%3DUTF-8%26q%3D' + encodeURIComponent(encodeURIComponent(data.message.replace('&nbsp;', ' '))) + '%22&format=json', function(a) {
                            if (a.error) {
                                $msg.html(previousMessages + convertEmotes(convertImageLinks(data.message)));
                                $this.data('translated', false);
                            } else {
                                $msg.html(previousMessages + convertEmotes(convertImageLinks(p3Utils.objectSelector(a, 'query.results.json.sentences.trans', data.message))));
                                $this.data('translated', true);
                            }
                        }, 'json');
                    }
                    e.stopPropagation();
                });
            }

            function onInputKeyUp(e) {
                if (e.keyCode === 38) {
                    onInputMove(true, $(this));
                } else if (e.keyCode === 40) {
                    onInputMove(false, $(this));
                }
            }

            function onInputMove(up, $this) {
                var latestInputs = p3Utils.getUserData(-1, 'latestInputs', []);

                if (latestInputs.length === 0) return;

                var curPos = p3Utils.getUserData(-1, 'curInputPos', 0);
                var tmpInput = p3Utils.getUserData(-1, 'tmpInput', null);

                if ((tmpInput == null && up) || curPos === 0) {
                    tmpInput = $this.val();
                } else if (tmpInput == null) {
                    return;
                }

                curPos = Math.max(0, Math.min(curPos + (up ? 1 : -1), latestInputs.length));

                p3Utils.setUserData(-1, 'curInputPos', curPos);
                p3Utils.setUserData(-1, 'tmpInput', tmpInput);

                $this.val(curPos === 0 ? tmpInput : latestInputs[latestInputs.length - curPos]);
            }

            var Handler = Class.extend({
                loadTwitchEmotes: function() {
                    if (RoomSettings.rules.allowEmotes === false) return;
                    $.getJSON('https://twitchemotes.com/api_cache/v2/global.json', function(data) {
                        twitchEmoteTemplate = data.template.small;

                        twitchEmotes = [];
                        for (var i in data.emotes) {
                            if (!data.emotes.hasOwnProperty(i)) continue;
                            twitchEmotes.push({
                                emote: i,
                                image_id: data.emotes[i].image_id
                            });
                        }

                        console.log('[plug³ Twitch Emotes]', twitchEmotes.length + ' Twitch.TV emoticons loaded!');
                    });
                },
                loadTastyEmotes: function() {

                },
                register: function() {
                    Context.on('chat:receive', onChatReceived);
                    Context._events['chat:receive'].unshift(Context._events['chat:receive'].pop());
                    Context.on('chat:receive', onChatReceivedLate);

                    $('#chat-input-field').on('keyup', onInputKeyUp);
                },
                close: function() {
                    Context.off('chat:receive', onChatReceived);
                    Context.off('chat:receive', onChatReceivedLate);

                    $('#chat-input-field').off('keyup', onInputKeyUp);
                }
            });

            return new Handler();
        });


        define('plugCubed/dialogs/Menu', ['jquery', 'plugCubed/Class', 'plugCubed/Version', 'plugCubed/enums/Notifications', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/StyleManager', 'plugCubed/RoomSettings', 'plugCubed/Slider', 'plugCubed/dialogs/CustomChatColors', 'plugCubed/dialogs/ControlPanel', 'plugCubed/handlers/ChatHandler'], function($, Class, Version, enumNotifications, Settings, p3Utils, p3Lang, Styles, RoomSettings, Slider, dialogColors, dialogControlPanel, ChatHandler) {

            var $wrapper, $menuDiv, MenuClass, that, menuButton, streamButton, clearChatButton, _onClick, Context, Database, Lang;

            Context = window.plugCubedModules.context;
            Database = window.plugCubedModules.database;
            Lang = window.plugCubedModules.Lang;
            menuButton = $('<div id="plugcubed"><div class="cube-wrap"><div class="cube"><i class="icon icon-plugcubed"></i><i class="icon icon-plugcubed other"></i></div></div></div>');
            streamButton = $('<div>').addClass('chat-header-button p3-s-stream').data('key', 'stream');
            clearChatButton = $('<div>').addClass('chat-header-button p3-s-clear').data('key', 'clear');

            function guiButton(setting, id, text) {
                return $('<div>').addClass('item p3-s-' + id + (setting ? ' selected' : '')).append($('<i>').addClass('icon icon-check-blue')).append($('<span>').text(text)).data('key', id).click(_onClick);
            }

            MenuClass = Class.extend({
                init: function() {
                    that = this;
                    _onClick = $.proxy(this.onClick, this);

                    this.shown = false;

                    $('#app-menu').after(menuButton);
                    menuButton.click(function() {
                        that.toggleMenu();
                        dialogControlPanel.toggleControlPanel(false);
                    });
                    $('#room-bar').css('left', 108).find('.favorite').css('right', 55);
                    $('#plugcubed .cube-wrap .cube').bind('webkitAnimationEnd mozAnimationEnd msAnimationEnd animationEnd', function() {
                        $('#plugcubed .cube-wrap .cube').removeClass('spin');
                    });
                    $('#plugcubed').mouseenter(function() {
                        $('#plugcubed .cube-wrap .cube').addClass('spin');
                    });
                    $('#chat-header').append(streamButton.click($.proxy(this.onClick, this)).mouseover(function() {
                        Context.trigger('tooltip:show', p3Lang.i18n('tooltip.stream'), $(this), true);
                    }).mouseout(function() {
                        Context.trigger('tooltip:hide');
                    })).append(clearChatButton.click($.proxy(this.onClick, this)).mouseover(function() {
                        Context.trigger('tooltip:show', p3Lang.i18n('tooltip.clear'), $(this), true);
                    }).mouseout(function() {
                        Context.trigger('tooltip:hide');
                    }));
                    this.onRoomJoin();

                    Context.on('room:joined', this.onRoomJoin, this);
                },
                onRoomJoin: function() {
                    this.setEnabled('stream', Database.settings.streamDisabled);
                },
                close: function() {
                    menuButton.remove();
                    if ($wrapper != null) {
                        $wrapper.remove();
                    }
                    $('#room-bar').css('left', 54).find('.favorite').css('right', 0);
                    streamButton.remove();
                    clearChatButton.remove();

                    Context.off('room:joined', this.onRoomJoin, this);
                    dialogControlPanel.close();
                },

                /**
                 * Set whether a menu setting is enabled
                 * @param {String} id Menu setting ID
                 * @param {Boolean} value Is this menu setting enabled?
                 */
                setEnabled: function(id, value) {
                    var elem = $('.p3-s-' + id).removeClass('selected');

                    if (value) elem.addClass('selected');
                },

                /**
                 * Handle click event
                 * @param {Event} e The click event
                 */
                onClick: function(e) {
                    var a = $(e.currentTarget).data('key');

                    switch (a) {
                        case 'woot':
                            Settings.autowoot = !Settings.autowoot;
                            this.setEnabled('woot', Settings.autowoot);
                            if (Settings.autowoot) {
                                (function() {
                                    var dj = API.getDJ();

                                    if (dj === null || dj.id === API.getUser().id) return;
                                    $('#woot').click();
                                })();
                            }
                            break;
                        case 'join':
                            Settings.autojoin = !Settings.autojoin;
                            this.setEnabled('join', Settings.autojoin);
                            if (Settings.autojoin) {
                                (function() {
                                    var dj = API.getDJ();

                                    if ((dj != null && dj.id === API.getUser().id) || API.getWaitListPosition() > -1) return;
                                    $('#dj-button').click();
                                })();
                            }
                            break;
                        case 'chatimages':
                            Settings.chatImages = !Settings.chatImages;
                            this.setEnabled('chatimages', Settings.chatImages);
                            break;
                        case 'twitchemotes':
                            Settings.twitchEmotes = !Settings.twitchEmotes;
                            if (Settings.twitchEmotes) {
                                ChatHandler.loadTwitchEmotes();
                            }
                            this.setEnabled('twitchemotes', Settings.twitchEmotes);
                            break;
                        case 'colors':
                            dialogColors.render();
                            break;
                        case 'controlpanel':
                            dialogControlPanel.toggleControlPanel(true);
                            this.toggleMenu(false);
                            break;
                        case 'autorespond':
                            Settings.autorespond = !Settings.autorespond;
                            this.setEnabled('autorespond', Settings.autorespond);
                            if (Settings.autorespond) {
                                if (Settings.awaymsg.trim() === '') {
                                    Settings.awaymsg = p3Lang.i18n('autorespond.default');
                                }
                                $('#chat-input-field').attr('disabled', 'disabled').attr('placeholder', p3Lang.i18n('autorespond.disable'));
                            } else {
                                $('#chat-input-field').removeAttr('disabled').attr('placeholder', Lang.chat.placeholder);
                            }
                            break;
                        case 'notify-join':
                        case 'notify-leave':
                        case 'notify-grab':
                        case 'notify-meh':
                        case 'notify-stats':
                        case 'notify-updates':
                        case 'notify-history':
                        case 'notify-songLength':
                        case 'notify-unavailable':
                        case 'notify-boothAlert':
                            var elem = $('.p3-s-' + a);

                            if (!elem.data('perm') || (API.hasPermission(undefined, elem.data('perm')) || p3Utils.isPlugCubedDeveloper())) {
                                var bit = elem.data('bit');

                                Settings.notify += (Settings.notify & bit) === bit ? -bit : bit;
                                this.setEnabled(a, (Settings.notify & bit) === bit);
                            }
                            break;
                        case 'stream':
                            Database.settings.streamDisabled = !Database.settings.streamDisabled;
                            Database.save();
                            Context.trigger('change:streamDisabled');
                            this.setEnabled('stream', Database.settings.streamDisabled);
                            break;
                        case 'clear':
                            Context.trigger('ChatFacadeEvent:clear');
                            break;
                        case 'roomsettings':
                            var b = Settings.useRoomSettings[p3Utils.getRoomID()];

                            b = !(b == null || b === true);
                            Settings.useRoomSettings[p3Utils.getRoomID()] = b;
                            if (b) RoomSettings.update();
                            RoomSettings.execute(b);
                            this.setEnabled('roomsettings', b);
                            break;
                        case 'inlineuserinfo':
                            Settings.moderation.inlineUserInfo = !Settings.moderation.inlineUserInfo;
                            this.setEnabled('inlineuserinfo', Settings.moderation.inlineUserInfo);
                            break;
                        case 'showdeletedmessages':
                            Settings.moderation.showDeletedMessages = !Settings.moderation.showDeletedMessages;
                            this.setEnabled('showdeletedmessages', Settings.moderation.showDeletedMessages);
                            break;
                        case 'chatlog':
                            Settings.chatLog = !Settings.chatLog;
                            this.setEnabled('chatlog', Settings.chatLog);
                            break;
                        case 'afktimers':
                            Settings.moderation.afkTimers = !Settings.moderation.afkTimers;
                            this.setEnabled('afktimers', Settings.moderation.afkTimers);
                            if (Settings.moderation.afkTimers) {

                                // Styles.set('waitListMove', '#waitlist .list .user .name { top: 2px; }');
                            } else {

                                // Styles.unset('waitListMove');
                                $('#waitlist').find('.user .afkTimer').remove();
                            }
                            break;
                        case 'etatimer':
                            Settings.etaTimer = !Settings.etaTimer;
                            this.setEnabled('etatimer', Settings.etaTimer);
                            if (Settings.etaTimer) {
                                Styles.set('etaTimer', '#your-next-media .song { top: 8px!important; }');
                            } else {
                                Styles.unset('etaTimer');
                                var $djButton = $('#dj-button').find('span');
                                var waitListPos = API.getWaitListPosition();

                                if (waitListPos < 0) {
                                    $djButton.html(API.getWaitList().length < 50 ? Lang.dj.waitJoin : Lang.dj.waitFull);
                                    break;
                                }

                                $djButton.html(Lang.dj.waitLeave);
                            }
                            break;
                        default:
                            API.chatLog(p3Lang.i18n('error.unknownMenuKey', a));
                            break;
                    }
                    Settings.save();
                },

                /**
                 * Create the menu.
                 * If the menu already exists, it will recreate it.
                 */
                createMenu: function() {
                    if ($menuDiv != null) {
                        $menuDiv.remove();
                    }
                    $menuDiv = $('<div>').css('left', this.shown ? 0 : -500).attr('id', 'p3-settings');
                    var header = $('<div>').addClass('header');
                    var container = $('<div>').addClass('container');

                    // Header
                    header.append($('<div>').addClass('back').append($('<i>').addClass('icon icon-arrow-left')).click(function() {
                        that.toggleMenu(false);
                    }));
                    header.append($('<div>').addClass('title').append($('<i>').addClass('icon icon-settings-white')).append($('<span>plug&#179;</span>')).append($('<span>').addClass('version').text(Version)));

                    // Features
                    container.append($('<div>').addClass('section').text('Features'));
                    if (RoomSettings.rules.allowAutowoot !== false) {
                        container.append(guiButton(Settings.autowoot, 'woot', p3Lang.i18n('menu.autowoot')));
                    }

                    if (RoomSettings.rules.allowAutojoin !== false) {
                        container.append(guiButton(Settings.autojoin, 'join', p3Lang.i18n('menu.autojoin')));
                    }

                    if (RoomSettings.rules.allowAutorespond !== false) {
                        container.append(guiButton(Settings.autorespond, 'autorespond', p3Lang.i18n('menu.autorespond')));
                        container.append($('<div class="item">').addClass('p3-s-autorespond-input').append($('<input>').val(Settings.awaymsg === '' ? p3Lang.i18n('autorespond.default') : Settings.awaymsg).keyup(function() {
                            $(this).val($(this).val().split('@').join(''));
                            Settings.awaymsg = $(this).val().trim();
                            Settings.save();
                        })).mouseover(function() {
                            Context.trigger('tooltip:show', p3Lang.i18n('tooltip.afk'), $(this), false);
                        }).mouseout(function() {
                            Context.trigger('tooltip:hide');
                        }));
                    }

                    if (p3Utils.isPlugCubedDeveloper() || API.hasPermission(undefined, API.ROLE.BOUNCER)) {
                        container.append(guiButton(Settings.moderation.afkTimers, 'afktimers', p3Lang.i18n('menu.afktimers')));
                        container.append(guiButton(Settings.moderation.showDeletedMessages, 'showdeletedmessages', p3Lang.i18n('menu.showdeletedmessages')));
                        container.append(guiButton(Settings.moderation.inlineUserInfo, 'inlineuserinfo', p3Lang.i18n('menu.inlineuserinfo')));
                    }

                    if (RoomSettings.haveRoomSettings) {
                        container.append(guiButton(Settings.useRoomSettings[p3Utils.getRoomID()] != null ? Settings.useRoomSettings[p3Utils.getRoomID()] : true, 'roomsettings', p3Lang.i18n('menu.roomsettings')));
                    }
                    container.append(guiButton(Settings.chatLog, 'chatlog', p3Lang.i18n('menu.chatlog')));
                    container.append(guiButton(Settings.etaTimer, 'etatimer', p3Lang.i18n('menu.etatimer')));
                    container.append(guiButton(Settings.chatImages, 'chatimages', p3Lang.i18n('menu.chatimages')));
                    if (RoomSettings.rules.allowEmotes !== false) {
                        container.append(guiButton(Settings.twitchEmotes, 'twitchemotes', p3Lang.i18n('menu.twitchemotes')));
                    }
                    container.append(guiButton(false, 'colors', p3Lang.i18n('menu.customchatcolors') + '...'));

                    if (p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador()) {
                        container.append(guiButton(false, 'controlpanel', p3Lang.i18n('menu.controlpanel') + '...'));
                    }

                    // Divider
                    container.append($('<div class="spacer">').append($('<div class="divider">')));

                    // Notification
                    container.append($('<div class="section">' + p3Lang.i18n('notify.header') + '</div>'));

                    container.append(guiButton((Settings.notify & enumNotifications.USER_JOIN) === enumNotifications.USER_JOIN, 'notify-join', p3Lang.i18n('notify.join')).data('bit', enumNotifications.USER_JOIN));
                    container.append(guiButton((Settings.notify & enumNotifications.USER_LEAVE) === enumNotifications.USER_LEAVE, 'notify-leave', p3Lang.i18n('notify.leave')).data('bit', enumNotifications.USER_LEAVE));
                    container.append(guiButton((Settings.notify & enumNotifications.USER_GRAB) === enumNotifications.USER_GRAB, 'notify-grab', p3Lang.i18n('notify.grab')).data('bit', enumNotifications.USER_GRAB));
                    container.append(guiButton((Settings.notify & enumNotifications.USER_MEH) === enumNotifications.USER_MEH, 'notify-meh', p3Lang.i18n('notify.meh')).data('bit', enumNotifications.USER_MEH));
                    container.append(guiButton((Settings.notify & enumNotifications.SONG_STATS) === enumNotifications.SONG_STATS, 'notify-stats', p3Lang.i18n('notify.stats')).data('bit', enumNotifications.SONG_STATS));
                    container.append(guiButton((Settings.notify & enumNotifications.SONG_UPDATE) === enumNotifications.SONG_UPDATE, 'notify-updates', p3Lang.i18n('notify.updates')).data('bit', enumNotifications.SONG_UPDATE));
                    var boothAlertSlider = new Slider(1, 50, Settings.boothAlert, function(v) {
                        Settings.boothAlert = v;
                        Settings.save();
                        $('.p3-s-notify-boothAlert').find('span').text(p3Lang.i18n('notify.boothAlert', v));
                    });

                    container.append(guiButton((Settings.notify & enumNotifications.BOOTH_ALERT) === enumNotifications.BOOTH_ALERT, 'notify-boothAlert', p3Lang.i18n('notify.boothAlert', Settings.boothAlert)).data('bit', enumNotifications.BOOTH_ALERT));
                    container.append(boothAlertSlider.$slider.css('left', 40));
                    if (boothAlertSlider != null) {
                        boothAlertSlider.onChange();
                    }
                    if (API.hasPermission(undefined, API.ROLE.BOUNCER) || p3Utils.isPlugCubedDeveloper()) {
                        var songLengthSlider = new Slider(5, 30, Settings.notifySongLength, function(v) {
                            Settings.notifySongLength = v;
                            Settings.save();
                            $('.p3-s-notify-songLength').find('span').text(p3Lang.i18n('notify.songLength', v));
                        });

                        container.append(guiButton((Settings.notify & enumNotifications.SONG_HISTORY) === enumNotifications.SONG_HISTORY, 'notify-history', p3Lang.i18n('notify.history')).data('bit', enumNotifications.SONG_HISTORY).data('perm', API.ROLE.BOUNCER));
                        container.append(guiButton((Settings.notify & enumNotifications.SONG_UNAVAILABLE) === enumNotifications.SONG_UNAVAILABLE, 'notify-unavailable', p3Lang.i18n('notify.songUnavailable')).data('bit', enumNotifications.SONG_UNAVAILABLE).data('perm', API.ROLE.BOUNCER));
                        container.append(guiButton((Settings.notify & enumNotifications.SONG_LENGTH) === enumNotifications.SONG_LENGTH, 'notify-songLength', p3Lang.i18n('notify.songLength', Settings.notifySongLength)).data('bit', enumNotifications.SONG_LENGTH).data('perm', API.ROLE.BOUNCER));
                        container.append(songLengthSlider.$slider.css('left', 40));
                        if (songLengthSlider != null) {
                            songLengthSlider.onChange();
                        }

                    }
                    if ($wrapper == null) {
                        $wrapper = $('<div>').attr('id', 'p3-settings-wrapper');
                        $('body').append($wrapper);
                    }
                    $wrapper.append($menuDiv.append(header).append(container));
                },

                /**
                 * Toggle the visibility of the menu
                 * @param {Boolean} [shown] Force it to be shown or hidden.
                 */
                toggleMenu: function(shown) {
                    if ($menuDiv == null) {
                        this.createMenu();
                    }
                    this.shown = shown == null ? !this.shown : shown;
                    if (!this.shown) {
                        dialogColors.hide();
                    }
                    $menuDiv.animate({
                        left: this.shown ? 0 : -500
                    }, {
                        complete: function() {
                            if (!that.shown && $menuDiv) {
                                $menuDiv.detach();
                                $menuDiv = undefined;
                            }
                        }
                    });
                }
            });

            return new MenuClass();
        });

        define('plugCubed/dialogs/Commands', ['jquery', 'plugCubed/Class', 'plugCubed/Lang', 'plugCubed/Utils'], function($, Class, p3Lang, p3Utils) {
            var userCommands = [
                ['/badges (commands.variables.on / | /commands.variables.off)', 'commands.descriptions.badges'],
                ['/join', 'commands.descriptions.join'],
                ['/leave', 'commands.descriptions.leave'],
                ['/whoami', 'commands.descriptions.whoami'],
                ['/mute', 'commands.descriptions.mute'],
                ['/automute', 'commands.descriptions.automute'],
                ['/unmute', 'commands.descriptions.unmute'],
                ['/nextsong', 'commands.descriptions.nextsong'],
                ['/refresh', 'commands.descriptions.refresh'],
                ['/status', 'commands.descriptions.status'],
                ['/alertson (commands.variables.word)', 'commands.descriptions.alertson'],
                ['/alertsoff', 'commands.descriptions.alertsoff'],
                ['/grab', 'commands.descriptions.grab'],
                ['/getpos', 'commands.descriptions.getpos'],
                ['/version', 'commands.descriptions.version'],
                ['/commands', 'commands.descriptions.commands'],
                ['/link', 'commands.descriptions.link'],
                ['/unload', 'commands.descriptions.unload'],
                ['/volume (commands.variables.number / + / | / - )']
            ];
            var modCommands = [
                ['/whois (commands.variables.username)', 'commands.descriptions.whois', API.ROLE.BOUNCER],
                ['/skip', 'commands.descriptions.skip', API.ROLE.BOUNCER],
                ['/ban (commands.variables.username)', 'commands.descriptions.ban', API.ROLE.BOUNCER],
                ['/lockskip', 'commands.descriptions.lockskip', API.ROLE.MANAGER],
                ['/lock', 'commands.descriptions.lock', API.ROLE.MANAGER],
                ['/unlock', 'commands.descriptions.unlock', API.ROLE.MANAGER],
                ['/add (commands.variables.username)', 'commands.descriptions.add', API.ROLE.BOUNCER],
                ['/remove (commands.variables.username)', 'commands.descriptions.remove', API.ROLE.BOUNCER],
                ['/whois all', 'commands.descriptions.whois', API.ROLE.AMBASSADOR]
            ];
            var A = Class.extend({
                userCommands: function() {
                    var response = '<strong style="position:relative;left: 20%;">=== ' + p3Lang.i18n('commands.userCommands') + ' ===</strong><br><ul class="p3-commands">';

                    for (var i = 0; i < userCommands.length; i++) {
                        if (!userCommands[i]) continue;
                        var command = userCommands[i][0];

                        if (command.split('(').length > 1 && command.split(')').length > 1) {
                            var argumentTranslationParts = command.split('(')[1].split(')')[0].split('/');

                            command = command.split('(')[0] + '<em>';

                            for (var j in argumentTranslationParts) {
                                if (!argumentTranslationParts.hasOwnProperty(j)) continue;
                                if (argumentTranslationParts[j] === ' | ' || argumentTranslationParts[j] === ' + ' || argumentTranslationParts[j] === ' - ') {
                                    command += argumentTranslationParts[j];
                                } else {
                                    command += p3Lang.i18n(argumentTranslationParts[j].trim());
                                }
                            }

                            command += '</em>';
                        }
                        response += '<li class="userCommands">' + command + '<br><em>' + p3Lang.i18n(userCommands[i][1]) + '</em></li>';
                    }
                    response += '</ul>';

                    return response;
                },
                modCommands: function() {
                    var response = '<br><strong style="position:relative;left: 20%;">=== ' + p3Lang.i18n('commands.modCommands') + ' ===</strong><br><ul class="p3-commands">';

                    for (var i = 0; i < modCommands.length; i++) {
                        if (!modCommands[i]) continue;
                        if (API.hasPermission(undefined, modCommands[i][2])) {
                            var command = modCommands[i][0];

                            if (command.split('(').length > 1) {
                                var argumentTranslationParts = command.split('(')[1].split(')')[0].split('/');

                                command = command.split('(')[0] + '<em>';

                                for (var j in argumentTranslationParts) {
                                    if (!argumentTranslationParts.hasOwnProperty(j)) continue;
                                    if (argumentTranslationParts[j] === '+' || argumentTranslationParts[j] === '-') {
                                        command += argumentTranslationParts[j];
                                    } else {
                                        command += p3Lang.i18n(argumentTranslationParts[j]);
                                    }
                                }

                                command += '</em>';
                            }
                            response += '<li class="modCommands">' + command + '<br><em>' + p3Lang.i18n(modCommands[i][1]) + '</em></li>';
                        }
                    }
                    response += '</ul>';

                    return response;
                },
                print: function() {
                    var content = '<strong style="font-size:1.4em;position:relative;left: 20%">' + p3Lang.i18n('commands.header') + '</strong><br>';

                    content += this.userCommands();
                    if (API.hasPermission(undefined, API.ROLE.BOUNCER)) {
                        content += this.modCommands();
                    }
                    p3Utils.chatLog(undefined, content, undefined, -1);
                }
            });

            return new A();
        });

        define('plugCubed/handlers/CommandHandler', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Utils', 'plugCubed/Lang', 'plugCubed/dialogs/Commands', 'plugCubed/Settings', 'plugCubed/Version', 'plugCubed/StyleManager', 'plugCubed/bridges/PlaybackModel'], function(TriggerHandler, p3Utils, p3Lang, dialogCommands, Settings, Version, StyleManager, PlaybackModel) {
            var CommandHandler, user, Context;

            Context = window.plugCubedModules.context;

            function commandLog(message) {
                p3Utils.chatLog('message', message, undefined, -11);
            }
            CommandHandler = TriggerHandler.extend({
                trigger: API.CHAT_COMMAND,
                handler: function(value) {
                    var i;
                    var args = value.split(' ');
                    var command = args.shift().substr(1);

                    if (p3Utils.equalsIgnoreCase(command, 'commands')) {
                        dialogCommands.print();
                    } else if (p3Utils.equalsIgnoreCase(command, 'badges')) {
                        if (args.length > 0) {
                            if (p3Utils.equalsIgnoreCase(args[0], p3Lang.i18n('commands.variables.off')) && Settings.badges) {
                                StyleManager.set('hide-badges', '#chat .msg { padding: 5px 8px 6px 8px; } #chat-messages .badge-box { display: none; }');
                                Settings.badges = false;
                                commandLog(p3Lang.i18n('commands.responses.badgeoff'));
                            } else if (p3Utils.equalsIgnoreCase(args[0], p3Lang.i18n('commands.variables.on')) && !Settings.badges) {
                                StyleManager.unset('hide-badges');
                                Settings.badges = true;
                                commandLog(p3Lang.i18n('commands.responses.badgeon'));
                            }
                        } else {
                            Settings.badges = !Settings.badges;
                            if (Settings.badges) {
                                StyleManager.unset('hide-badges');
                            } else {
                                StyleManager.set('hide-badges', '#chat .msg { padding: 5px 8px 6px 8px; } #chat-messages .badge-box { display: none; }');

                            }
                            commandLog(p3Lang.i18n((Settings.badges ? 'commands.responses.badgeon' : 'commands.responses.badgeoff')));
                        }
                        Settings.save();
                    } else if (p3Utils.equalsIgnoreCase(command, 'join')) {
                        if (API.getWaitListPosition() !== -1) return;
                        API.djJoin();

                        return;
                    } else if (p3Utils.equalsIgnoreCase(command, 'leave')) {
                        if (API.getWaitListPosition() === -1) return;
                        API.djLeave();
                    } else if (p3Utils.equalsIgnoreCase(command, 'unload')) {
                        if (typeof window.plugCubed === 'undefined') return;

                        return window.plugCubed.close();
                    } else if (p3Utils.equalsIgnoreCase(command, 'whoami')) {
                        p3Utils.getUserInfo(API.getUser().id);
                    } else if (p3Utils.equalsIgnoreCase(command, 'refresh')) {
                        $('.button.refresh').click();
                    } else if (p3Utils.equalsIgnoreCase(command, 'volume')) {
                        if (args.length > 0) {
                            if (_.isFinite(args[0])) {
                                API.setVolume(~~args[0]);
                            } else if (args[0] === '+') {
                                API.setVolume(API.getVolume() + 1);
                            } else if (args[0] === '-') {
                                API.setVolume(API.getVolume() - 1);
                            }
                        }
                    } else if (p3Utils.equalsIgnoreCase(command, 'version')) {
                        commandLog(p3Lang.i18n('running', Version));
                    } else if (p3Utils.equalsIgnoreCase(command, 'mute')) {
                        if (API.getVolume() === 0) return;
                        PlaybackModel.mute();
                    } else if (p3Utils.equalsIgnoreCase(command, 'unmute')) {
                        if (API.getVolume() > 0) return;
                        PlaybackModel.unmute();
                    } else if (p3Utils.equalsIgnoreCase(command, 'muteonce')) {
                        if (API.getVolume() === 0) return;
                        PlaybackModel.muteOnce();
                    } else if (p3Utils.equalsIgnoreCase(command, 'link')) {
                        API.sendChat('plugCubed : http://plugcubed.net');
                    } else if (p3Utils.equalsIgnoreCase(command, 'status')) {
                        p3Utils.statusREST(function(status, text, time) {
                            p3Utils.chatLog(undefined, p3Lang.i18n('commands.responses.status.rest', status, text, time), status === 200 ? '00FF00' : 'FF0000', -1);
                        });
                        p3Utils.statusSocket(function(status, text, time) {
                            p3Utils.chatLog(undefined, p3Lang.i18n('commands.responses.status.socket', status, text, time), status === 1000 ? '00FF00' : 'FF0000', -1);
                        });
                    } else if (p3Utils.equalsIgnoreCase(command, 'nextsong')) {
                        var nextSong = API.getNextMedia();

                        if (nextSong == null) {
                            commandLog(p3Lang.i18n('error.noNextSong'));

                            return;
                        }
                        nextSong = nextSong.media;
                        var p3history = require('plugCubed/notifications/History');
                        var historyInfo = p3history.isInHistory(nextSong.id);

                        commandLog(p3Lang.i18n('commands.responses.nextsong', nextSong.title, nextSong.author));
                        if (historyInfo.pos > -1 && !historyInfo.skipped) {
                            commandLog(p3Lang.i18n('commands.responses.isHistory', historyInfo.pos, historyInfo.length));
                        }
                    } else if (p3Utils.equalsIgnoreCase(command, 'automute')) {
                        var media = API.getMedia();

                        if (media == null) return;
                        if (Settings.registeredSongs.indexOf(media.id) < 0) {
                            Settings.registeredSongs.push(media.id);
                            PlaybackModel.muteOnce();
                            commandLog(p3Lang.i18n('commands.responses.automute.registered', media.title));
                        } else {
                            Settings.registeredSongs.splice(Settings.registeredSongs.indexOf(media.id), 1);
                            PlaybackModel.unmute();
                            commandLog(p3Lang.i18n('commands.responses.automute.unregistered', media.title));
                        }
                        Settings.save();
                    } else if (p3Utils.equalsIgnoreCase(command, 'getpos')) {
                        var lookup = p3Utils.getUser(value.substr(8));

                        user = lookup === null ? API.getUser() : lookup;
                        var spot = API.getWaitListPosition(user.id);

                        if (API.getDJ().id === user.id) {
                            commandLog(p3Lang.i18n('info.userDjing', user.id === API.getUser().id ? p3Lang.i18n('ranks.you') : p3Utils.cleanTypedString(user.username)));
                        } else if (spot === 0) {
                            commandLog(p3Lang.i18n('info.userNextDJ', user.id === API.getUser().id ? p3Lang.i18n('ranks.you') : p3Utils.cleanTypedString(user.username)));
                        } else if (spot > 0) {
                            commandLog(p3Lang.i18n('info.inWaitlist', spot + 1, API.getWaitList().length));
                        } else {
                            commandLog(p3Lang.i18n('info.notInList'));
                        }
                    } else if (p3Utils.equalsIgnoreCase(command, 'grab')) {
                        var playlists = window.plugCubedModules.playlists;

                        if (!playlists.models) return commandLog(p3Lang.i18n('errorGettingPlaylistInfo'));
                        if (!playlists.models.length) return commandLog(p3Lang.i18n('error.noPlaylistsFound'));

                        for (i in playlists.models) {
                            if (!playlists.models.hasOwnProperty(i)) continue;

                            var playlist = playlists.models[i].attributes;

                            if (playlist.active) {
                                if (playlist.count < 200) {
                                    var historyID = PlaybackModel.get('historyID');
                                    var MGE = window.plugCubedModules.MediaGrabEvent;

                                    Context.dispatch(new MGE(MGE.GRAB, playlist.id, historyID));
                                } else {
                                    return commandLog(p3Lang.i18n('error.yourActivePlaylistIsFull'));
                                }
                            }
                        }
                    } else if (p3Utils.startsWithIgnoreCase(value, '/alertson ') && !p3Utils.equalsIgnoreCaseTrim(value, '/alertson')) {
                        Settings.alertson = value.substr(10).split(' ');
                        Settings.save();
                        commandLog(p3Lang.i18n('commands.responses.alertson', Settings.alertson.join(', ')));
                    } else if (p3Utils.equalsIgnoreCaseTrim(value, '/alertson') || p3Utils.startsWithIgnoreCase(value, '/alertsoff')) {
                        Settings.alertson = [];
                        Settings.save();
                        commandLog(p3Lang.i18n('commands.responses.alertsoff'));
                    }

                    /* Bouncer and above or p3 Ambassador / Dev */

                    if (API.hasPermission(undefined, API.ROLE.BOUNCER) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador()) {

                        if (p3Utils.equalsIgnoreCase(command, 'whois')) {
                            if (args.length > 0 && p3Utils.equalsIgnoreCase(args[0], 'all')) {
                                p3Utils.getAllUsers();
                            } else if (args.length > 0) {
                                p3Utils.getUserInfo(args.join(' '));
                            } else {
                                commandLog(p3Lang.i18n('error.invalidWhoisSyntax'));
                            }
                        }
                    }

                    /* Bouncer and above */
                    if (API.hasPermission(undefined, API.ROLE.BOUNCER)) {

                        if (p3Utils.equalsIgnoreCaseTrim(command, 'ban') || p3Utils.equalsIgnoreCase(command, 'ban')) {
                            if (value.indexOf('::') < 0) {
                                user = p3Utils.getUser(args.join(' '));
                                if (user == null) {
                                    commandLog(p3Lang.i18n('error.userNotFound'));
                                } else {
                                    API.moderateBanUser(user.id, 1, API.BAN.HOUR);
                                }
                            } else {
                                var time, reason, values; // eslint-disable-line one-var

                                values = value.split('::');

                                console.log(values[0].split('/ban').join(''));

                                user = p3Utils.getUser(values[0].split('/ban').join(''));
                                if (user == null) {
                                    commandLog(p3Lang.i18n('error.userNotFound'));
                                } else {
                                    if (_.isFinite(values[1])) {
                                        time = parseInt(values[1], 10);
                                    } else {
                                        commandLog(p3Lang.i18n('error.invalidBanTime'), values[1]);
                                    }
                                    if (_.isFinite(values[2])) {
                                        reason = parseInt(values[2], 10);
                                    } else {
                                        return;
                                    }
                                    if ([60, 1, 1440, 24, -1].indexOf(time) < 0) {
                                        commandLog(p3Lang.i18n('error.invalidBanTime'), time);

                                        return;
                                    }
                                    if (time === 60 || time === 1) time = API.BAN.HOUR;
                                    if (time === 24 || time === 1440) time = API.BAN.DAY;
                                    if (time === -1) time = API.BAN.PERMA;
                                    if ([1, 2, 3, 4, 5].indexOf(reason) < 0) {
                                        reason = 1;
                                    }
                                    API.moderateBanUser(user.id, reason, time);
                                }
                            }
                        } else if (p3Utils.equalsIgnoreCase(command, 'skip')) {
                            if (API.getDJ() == null) return;
                            if (value.length > 5) {
                                API.sendChat('@' + API.getDJ().username + ' - Reason for skip: ' + value.substr(5).trim());
                            }
                            API.moderateForceSkip();
                        } else if (p3Utils.equalsIgnoreCase(command, 'add')) {
                            if (args.length < 1) {
                                commandLog(p3Lang.i18n('error.invalidAddSyntax'));

                                return;
                            }
                            user = p3Utils.getUser(args.join(' '));
                            if (user !== null) {
                                if (API.getWaitListPosition(user.id) === -1) {
                                    API.moderateAddDJ(user.id);
                                } else {
                                    commandLog(p3Lang.i18n('error.alreadyInWaitList', user.username));
                                }
                            } else {
                                commandLog(p3Lang.i18n('error.userNotFound'));
                            }
                        } else if (p3Utils.equalsIgnoreCase(command, 'remove')) {
                            if (args.length < 1) {
                                commandLog(p3Lang.i18n('error.invalidRemoveSyntax'));

                                return;
                            }
                            user = p3Utils.getUser(args.join(' '));
                            if (user !== null) {
                                if (API.getWaitListPosition(user.id !== -1)) {
                                    API.moderateRemoveDJ(user.id);
                                } else {
                                    commandLog(p3Lang.i18n('error.notInWaitList', user.username));
                                }
                            } else {
                                commandLog(p3Lang.i18n('error.userNotFound'));
                            }
                        }
                    }

                    /* Manager and Above */
                    if (API.hasPermission(undefined, API.ROLE.MANAGER)) {
                        if (p3Utils.equalsIgnoreCase(command, 'lock')) {
                            API.moderateLockWaitList(true, false);

                            return;
                        }
                        if (p3Utils.equalsIgnoreCase(command, 'unlock')) {
                            API.moderateLockWaitList(false, false);

                            return;
                        }
                        if (p3Utils.equalsIgnoreCase(command, 'lockskip')) {
                            var userID = API.getDJ().id;

                            if (API.getDJ() == null) return;
                            API.once(API.ADVANCE, function() {
                                API.once(API.WAIT_LIST_UPDATE, function() {
                                    API.moderateMoveDJ(userID, 1);
                                });
                                API.moderateAddDJ(userID);
                            });
                            API.moderateForceSkip();

                            return;
                        }
                    }

                    /* BA and above only */
                    if (p3Utils.equalsIgnoreCase(command, 'banall') && p3Utils.hasPermission(undefined, API.ROLE.MANAGER, true)) {
                        var me = API.getUser();
                        var users = API.getUsers();

                        if (users.length < 2) return;
                        for (i in users) {
                            if (users.hasOwnProperty(i) && users[i].id !== me.id) {
                                API.moderateBanUser(users[i].id, 0, API.BAN.PERMA);
                            }
                        }
                    }
                }
            });

            return new CommandHandler();
        });

        define('plugCubed/handlers/DialogHandler', ['jquery', 'plugCubed/Class', 'plugCubed/Lang', 'plugCubed/Settings', 'plugCubed/enums/Notifications'], function($, Class, p3Lang, Settings, enumNotifications) {
            var dialogTarget, dialogObserver, Handler;

            Handler = Class.extend({
                register: function() {
                    dialogTarget = document.querySelector('#dialog-container');
                    dialogObserver = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            if (mutation.type === 'childList' && mutation.addedNodes[0] !== undefined) {
                                if (mutation.addedNodes[0].attributes[0].nodeValue === 'dialog-restricted-media') {
                                    if ((Settings.notify & enumNotifications.SONG_UNAVAILABLE) === enumNotifications.SONG_UNAVAILABLE) {
                                        $('#dialog-restricted-media .dialog-frame .icon').click();
                                    }
                                }
                            }
                        });
                    });
                    dialogObserver.observe(dialogTarget, {
                        childList: true
                    });
                },
                close: function() {
                    dialogObserver.disconnect();
                }
            });

            return new Handler();
        });

        define('plugCubed/handlers/FullscreenHandler', ['jquery', 'plugCubed/Class', 'plugCubed/Lang'], function($, Class, p3Lang) {
            var fullScreenButton, Context, Database, Handler;

            Context = window.plugCubedModules.context;
            Database = window.plugCubedModules.database;
            Handler = Class.extend({
                create: function() {
                    fullScreenButton = $('<div>')
                        .addClass('button p3-fullscreen')
                        .css('background-color', 'rgba(28,31,37,.7)')
                        .append($('<div>')
                            .addClass('box')
                            .text(Database.settings.videoOnly ? p3Lang.i18n('fullscreen.shrink') : p3Lang.i18n('fullscreen.enlarge')));
                    $('#playback-controls')
                        .append(fullScreenButton)
                        .find('.button')
                        .width('25%')
                        .parent()
                        .find('.button .box .icon')
                        .hide();

                    fullScreenButton.click($.proxy(this.onClick, this));
                },
                onClick: function() {
                    this.toggleFullScreen();
                },
                toggleFullScreen: function() {
                    Database.settings.videoOnly = !Database.settings.videoOnly;
                    Database.save();
                    Context.trigger('change:videoOnly').trigger('audience:pause', Database.settings.videoOnly);
                    fullScreenButton
                        .find('.box')
                        .text(Database.settings.videoOnly ? p3Lang.i18n('fullscreen.shrink') : p3Lang.i18n('fullscreen.enlarge'));
                },
                close: function() {
                    fullScreenButton.remove();
                    $('#playback-controls')
                        .find('.button')
                        .removeAttr('style')
                        .parent()
                        .find('.button .box .icon')
                        .show();
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Alertson', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils'], function(TriggerHandler, Settings, p3Utils) {
            var Handler = TriggerHandler.extend({
                trigger: 'chat',
                handler: function(data) {
                    for (var i in Settings.alertson) {
                        if (!Settings.alertson.hasOwnProperty(i)) continue;
                        if (data.message.indexOf(Settings.alertson[i]) > -1) {
                            p3Utils.playChatSound();

                            return;
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Autojoin', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/RoomSettings', 'plugCubed/Lang', 'plugCubed/Utils', 'plugCubed/dialogs/Menu'], function(TriggerHandler, Settings, RoomSettings, p3Lang, p3Utils, Menu) {
            var join, Handler;

            join = function() {
                var dj = API.getDJ();

                if ((dj != null && dj.id === API.getUser().id) || API.getWaitListPosition() > -1 || API.getWaitList().length === 50) return;
                $('#dj-button').click();
            };

            Handler = TriggerHandler.extend({
                lastPosition: API.getWaitListPosition(),
                trigger: {
                    advance: 'onDjAdvance',
                    waitListUpdate: 'onWaitListUpdate',
                    chat: 'onChat'
                },
                onDjAdvance: function(data) {
                    this.lastDJ = data.lastPlay != null && data.lastPlay.dj != null ? data.lastPlay.dj.id : null;
                    if (!Settings.autojoin || !RoomSettings.rules.allowAutojoin) return;
                    join();
                },
                onWaitListUpdate: function() {
                    var oldPosition = this.lastPosition;

                    this.lastPosition = API.getWaitListPosition();

                    // If autojoin is not enabled, don't try to disable
                    if (!Settings.autojoin) return;

                    // If user is DJing, don't try to disable
                    var dj = API.getDJ();

                    if (dj != null && dj.id === API.getUser().id) return;

                    // If user is in waitlist, don't try to disable
                    if (this.lastPosition > -1) return;

                    // If waitlist is full, don't try to disable
                    if (API.getWaitList().length === 50) return;

                    // If user was last DJ (DJ Cycle Disabled)
                    if (this.lastDJ === API.getUser().id) return;

                    // If the user was in the waitlist but is no longer, disable autojoin
                    if (oldPosition > -1) {

                        // Disable
                        Settings.autojoin = false;
                        Menu.setEnabled('join', Settings.autojoin);
                    }
                },
                onChat: function(data) {
                    if (!(RoomSettings.rules.allowAutojoin !== false && Settings.autojoin)) return;

                    var a, b;

                    a = data.type === 'mention' && API.hasPermission(data.uid, API.ROLE.BOUNCER);
                    b = data.message.indexOf('@') < 0 && (API.hasPermission(data.uid, API.ROLE.MANAGER) || p3Utils.isPlugCubedDeveloper(data.uid));
                    if (a || b) {
                        if (data.message.indexOf('!joindisable') > -1) {
                            Settings.autojoin = false;
                            Menu.setEnabled('join', Settings.autojoin);
                            Settings.save();
                            API.sendChat(p3Lang.i18n('autojoin.commandDisable', '@' + data.un));
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Automute', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Lang', 'plugCubed/bridges/PlaybackModel'], function(TriggerHandler, Settings, p3Lang, PlaybackModel) {
            var Handler = TriggerHandler.extend({
                trigger: 'advance',
                handler: function(data) {
                    if (data && data.media && Settings.registeredSongs.indexOf(data.media.id) > -1) {
                        setTimeout(function() {
                            PlaybackModel.muteOnce();
                        }, 800);
                        API.chatLog(p3Lang.i18n('commands.responses.automute.automuted', data.media.title));
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Autorespond', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Lang', 'plugCubed/Settings', 'plugCubed/RoomSettings', 'plugCubed/Utils', 'plugCubed/bridges/PlaybackModel', 'plugCubed/dialogs/Menu'], function(TriggerHandler, p3Lang, Settings, RoomSettings, p3Utils, PlaybackModel, Menu) {
            var Lang, Handler;

            Lang = window.plugCubedModules.Lang;
            Handler = TriggerHandler.extend({
                trigger: 'chat',
                handler: function(data) {
                    if (!(RoomSettings.rules.allowAutorespond !== false && Settings.autorespond)) return;

                    var that = this;

                    var a = data.type === 'mention' && API.hasPermission(data.uid, API.ROLE.BOUNCER);
                    var b = data.message.indexOf('@') < 0 && (API.hasPermission(data.uid, API.ROLE.MANAGER) || p3Utils.isPlugCubedDeveloper(data.uid));

                    if (a || b) {
                        if (data.message.indexOf('!afkdisable') > -1) {
                            Settings.autorespond = false;
                            Menu.setEnabled('autorespond', Settings.autorespond);
                            Settings.save();
                            API.sendChat(p3Lang.i18n('autorespond.commandDisable', '@' + data.un));
                            $('#chat-input-field').removeAttr('disabled').attr('placeholder', Lang.chat.placeholder);
                            if (this.timeoutId != null) {
                                clearTimeout(this.timeoutId);
                            }

                            return;
                        }
                    }

                    if (data.type === 'mention' && data.message.indexOf('@' + API.getUser().username) > -1) {
                        if (Settings.autorespond && !Settings.recent) {
                            Settings.recent = true;
                            $('#chat-input-field').attr('placeholder', p3Lang.i18n('autorespond.nextIn', p3Utils.getTimestamp(Date.now() + 18E4)));
                            this.timeoutId = setTimeout(function() {
                                $('#chat-input-field').attr('placeholder', p3Lang.i18n('autorespond.next'));
                                Settings.recent = false;
                                Settings.save();
                                that.timeoutId = null;
                            }, 18E4);
                            API.sendChat('[AFK] @' + data.un + ' ' + Settings.awaymsg.split('@').join(''));
                        }
                    }
                },
                close: function() {
                    this._super();
                    if (Settings.autorespond) {
                        $('#chat-input-field').removeAttr('disabled').attr('placeholder', Lang.chat.placeholder);
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Autowoot', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/RoomSettings', 'plugCubed/Utils'], function(TriggerHandler, Settings, RoomSettings, p3Utils) {
            var woot, Handler;

            woot = function() {
                var dj = API.getDJ();

                if (dj == null || dj.id === API.getUser().id) return;
                $('#woot').click();
            };

            Handler = TriggerHandler.extend({
                trigger: 'advance',
                handler: function(data) {
                    if (!data.media || !Settings.autowoot || !RoomSettings.rules.allowAutowoot) return;
                    setTimeout(function() {
                        woot();
                    }, p3Utils.randomRange(1, 10) * 1000);
                }
            });

            return new Handler();
        });

        define('plugCubed/features/Whois', ['jquery', 'plugCubed/Class', 'plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils'], function($, Class, TriggerHandler, Settings, p3Utils) {
            var WatcherClass = Class.extend({
                init: function() {
                    this.current = {
                        waitList: [],
                        dj: -1
                    };
                    this.last = {
                        waitList: [],
                        dj: -1
                    };
                    this.state = 0;
                },
                setWaitList: function(waitList) {
                    this.current.waitList = [];
                    for (var i in waitList) {
                        if (!waitList.hasOwnProperty(i)) continue;
                        this.current.waitList.push(waitList[i].id);
                    }
                    this.incrementState();
                },
                setDJ: function(dj) {
                    this.current.dj = dj ? dj.id : -1;
                    this.incrementState();
                },
                incrementState: function() {
                    this.state++;
                    if (this.state > 1) {
                        this.last = this.current;
                        this.current = {
                            waitList: [],
                            dj: -1
                        };
                        this.state = 0;
                    }
                }
            });

            var watcher = new WatcherClass();

            var Handler = TriggerHandler.extend({
                trigger: {
                    userJoin: 'onUserJoin',
                    userLeave: 'onUserLeave',
                    voteUpdate: 'onVoteUpdate',
                    advance: 'onDjAdvance',
                    waitListUpdate: 'onWaitListUpdate'
                },
                onUserJoin: function(data) {
                    if (p3Utils.getUserData(data.id, 'joinTime', 0) === 0) {
                        p3Utils.setUserData(data.id, 'joinTime', Date.now());
                    }
                },
                onUserLeave: function(data) {
                    var disconnects = p3Utils.getUserData(data.id, 'disconnects', {
                        count: 0
                    });

                    disconnects.count++;
                    disconnects.position = watcher.last.dj === data.id ? 0 : (watcher.last.waitList.indexOf(data.id) < 0 ? -1 : watcher.last.waitList.indexOf(data.id) + 1);
                    disconnects.time = Date.now();
                    p3Utils.setUserData(data.id, 'disconnects', disconnects);
                    this.onVoteUpdate({
                        user: {
                            id: data.id
                        },
                        vote: 0
                    });
                },
                onVoteUpdate: function(data) {
                    if (!data || !data.user) return;
                    var curVote, wootCount, mehCount;

                    curVote = p3Utils.getUserData(data.user.id, 'curVote', 0);
                    wootCount = p3Utils.getUserData(data.user.id, 'wootcount', 0) - (curVote === 1 ? 1 : 0) + (data.vote === 1 ? 1 : 0);
                    mehCount = p3Utils.getUserData(data.user.id, 'mehcount', 0) - (curVote === -1 ? 1 : 0) + (data.vote === -1 ? 1 : 0);

                    p3Utils.setUserData(data.user.id, 'wootcount', wootCount);
                    p3Utils.setUserData(data.user.id, 'mehcount', mehCount);
                    p3Utils.setUserData(data.user.id, 'curVote', data.vote);
                },
                onDjAdvance: function(data) {
                    if (data.media != null) {
                        watcher.setDJ(data.dj);
                    }
                    var users = API.getUsers();

                    for (var i in users) {
                        if (users.hasOwnProperty(i)) {
                            p3Utils.setUserData(users[i].id, 'curVote', 0);
                        }
                    }
                },
                onWaitListUpdate: function(data) {
                    watcher.setWaitList(data);
                }
            });

            return new Handler();
        });

        define('plugCubed/features/WindowTitle', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils'], function(TriggerHandler, Settings, p3Utils) {
            var Database, Handler, PlaybackModel;

            Database = window.plugCubedModules.database;
            PlaybackModel = window.plugCubedModules.currentMedia;
            Handler = TriggerHandler.extend({
                trigger: 'advance',
                register: function() {
                    this._super();
                    this.title = '';
                    this.titleClean = '';
                    this.titlePrefix = '';
                    PlaybackModel.on('change:streamDisabled change:volume change:muted', this.onStreamChange, this);
                    this.onStreamChange();
                },
                close: function() {
                    this._super();
                    if (this.intervalID) {
                        clearInterval(this.intervalID);
                    }
                    document.title = p3Utils.getRoomName();
                    PlaybackModel.off('change:streamDisabled change:volume change:muted', this.onStreamChange, this);
                },
                handler: function(data) {
                    if (Settings.songTitle && data.media && data.media.title) {
                        this.titlePrefix = (API.getVolume() > 0 && !Database.settings.streamDisabled ? '▶' : '❚❚') + ' ';

                        if (this.titleClean === data.media.author + ' - ' + data.media.title + ' :: ' + p3Utils.getRoomName() + ' :: ') return;

                        if (this.intervalID) {
                            clearInterval(this.intervalID);
                        }
                        this.titleClean = data.media.author + ' - ' + data.media.title + ' :: ' + p3Utils.getRoomName() + ' :: ';
                        this.title = (this.titlePrefix + this.titleClean).split(' ').join(' ');
                        document.title = this.title;
                        var that = this;

                        this.intervalID = setInterval(function() {
                            that.onIntervalTick();
                        }, 300);

                        return;
                    }
                    if (this.intervalID) {
                        clearInterval(this.intervalID);
                    }
                    document.title = p3Utils.getRoomName();
                },
                onIntervalTick: function() {
                    var title = this.title.substr(this.titlePrefix.length);

                    title = title.substr(1) + title.substr(0, 1);
                    this.title = this.titlePrefix + title;
                    document.title = this.title;
                },
                onStreamChange: function() {
                    this.handler({
                        media: API.getMedia()
                    });
                }
            });

            return new Handler();
        });

        define('plugCubed/features/ChatLog', ['plugCubed/handlers/TriggerHandler', 'plugCubed/Settings', 'plugCubed/Utils'], function(TriggerHandler, Settings, p3Utils) {
            var Lang, Handler;

            Lang = window.plugCubedModules.Lang;
            Handler = TriggerHandler.extend({
                trigger: 'p3:chat:pre',
                handler: function(data) {

                    // Logger adapted from Brinkie Pie https://github.com/JTBrinkmann

                    if (!Settings.chatLog) return;

                    var message, name, cid;

                    message = p3Utils.html2text(data.originalMessage);
                    if (data.un) {

                        // Remove Zero width spaces and collapse whitespace.
                        name = data.un.replace(/\u202e/g, '\\u202e').replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ');
                        name = p3Utils.cleanTypedString(p3Utils.repeatString(' ', 25 - name.length) + name);

                        if (data.cid) {
                            cid = data.cid.replace(/\u202e/g, '\\u202e').replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ');
                            cid = p3Utils.repeatString(' ', 25 - cid.length) + cid;

                            if (data.message.indexOf('/em') === 0 || data.message.indexOf('/me') === 0) {
                                console.log(
                                    p3Utils.getTimestamp() + ' \uD83D\uDCAC %c ' + cid + '%c' + name + ': %c' + message,
                                    '', 'font-weight: bold', 'font-style: italic');
                            } else {
                                console.log(
                                    p3Utils.getTimestamp() + ' \uD83D\uDCAC %c ' + cid + '%c' + name + ': %c' + message,
                                    '', 'font-weight: bold', '');
                            }
                        } else if (data.type.indexOf('moderation') > -1) {
                            console.info(
                                p3Utils.getTimestamp() + ' \uD83D\uDCAC %c ' + p3Utils.repeatString(' ', 25) + '%c' + name + ': %c' + message,
                                '', 'font-weight: bold', 'color: #ac76ff');
                        }
                    } else if (data.type.indexOf('system') > -1) {
                        var style = 'font-size: 1.2em; font-weight: bold; border: 1px solid #42a5dc';

                        console.info(
                            p3Utils.getTimestamp() + ' \uD83D\uDCAC %c ' + (typeof Lang != 'undefined' ? Lang.alerts.systemAlert : 'System Alert') + ':%c ' + message + ' ',
                            style + '; color: #42a5dc; border-right: none',
                            style + '; border-left: none'
                        );
                    } else {
                        console.log(p3Utils.getTimestamp() + ' \uD83D\uDCAC %c' + message, 'color: #36F');
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/Features', ['plugCubed/Class', 'plugCubed/features/Alertson', 'plugCubed/features/Autojoin', 'plugCubed/features/Automute', 'plugCubed/features/Autorespond', 'plugCubed/features/Autowoot', 'plugCubed/features/Whois', 'plugCubed/features/WindowTitle', 'plugCubed/features/ChatLog'], function() {
            var modules, Class, Handler;

            modules = _.toArray(arguments);
            Class = modules.shift();

            Handler = Class.extend({
                register: function() {
                    this.unregister();
                    for (var i = 0; i < modules.length; i++) {
                        if (!modules[i].registered) {
                            modules[i].register();
                        }
                    }
                },
                unregister: function() {
                    for (var i = 0; i < modules.length; i++) {
                        if (modules[i].registered) {
                            modules[i].close();
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/handlers/TickerHandler', ['jquery', 'plugCubed/Class'], function($, Class) {
            return Class.extend({

                // Time between each tick (in milliseconds)
                tickTime: 1E3,
                closed: false,
                init: function() {
                    this.proxy = $.proxy(this.handler, this);
                    this.proxy();
                },
                handler: function() {
                    this.tick();
                    if (!this.closed) {
                        this.timeoutID = setTimeout(this.proxy, this.tickTime);
                    }
                },

                // The function that is called on each tick
                tick: function() {},
                close: function() {
                    clearTimeout(this.timeoutID);
                    this.closed = true;
                }
            });
        });

        define('plugCubed/tickers/AFKTimer', ['jquery', 'plugCubed/handlers/TickerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang'], function($, TickerHandler, Settings, p3Utils, p3Lang) {
            var IgnoreCollection = window.plugCubedModules.ignoreCollection;
            var handler = TickerHandler.extend({
                tickTime: 1E3,
                tick: function() {
                    if (Settings.moderation.afkTimers && (p3Utils.isPlugCubedDeveloper() || API.hasPermission(undefined, API.ROLE.BOUNCER)) && $('#waitlist-button').hasClass('selected')) {
                        var a = API.getWaitList();
                        var b = $('#waitlist').find('.user');

                        for (var c = 0; c < a.length; c++) {
                            var d = Date.now() - p3Utils.getUserData(a[c].id, 'lastChat', p3Utils.getUserData(a[c].id, 'joinTime', Date.now()));
                            var e = IgnoreCollection._byId[a[c].id] === true ? p3Lang.i18n('error.ignoredUser') : p3Utils.formatTime(Math.round(d / 1000));
                            var f = $(b[c]).find('.afkTimer');

                            if (f.length < 1) {
                                f = $('<div>').addClass('afkTimer');
                                $(b[c]).find('.meta').append(f);
                            }

                            f.text(e);
                        }
                    }
                },
                close: function() {
                    this._super();
                    $('#waitlist').find('.user .afkTimer').remove();
                }
            });

            return handler;
        });

        define('plugCubed/tickers/ETATimer', ['jquery', 'plugCubed/handlers/TickerHandler', 'plugCubed/Settings', 'plugCubed/Utils', 'plugCubed/Lang'], function($, TickerHandler, Settings, p3Utils, p3Lang) {
            var booth, handler, Lang;

            booth = window.plugCubedModules.booth;
            Lang = window.plugCubedModules.Lang;

            try {
                handler = TickerHandler.extend({
                    tickTime: 1E3,
                    init: function() {
                        this.myID = API.getUser().id;
                        this.$span = null;
                        $('#your-next-media').find('span:first').removeClass('song').addClass('song');
                        this._super();
                    },
                    createElement: function() {
                        this.$span = $('<span class="eta dark-label">').css({
                            'font-size': '14px',
                            top: '28px'
                        });
                        $('#your-next-media').append(this.$span);
                    },
                    tick: function() {
                        if (Settings.etaTimer) {
                            if (this.$span == null) {
                                this.createElement();
                            }

                            if (API.getDJ() == null) {
                                this.$span.text(p3Lang.i18n('eta.boothAvailable'));

                                return;
                            }

                            if (API.getHistory() == null) {
                                return;
                            }

                            var time;

                            var isDJ = API.getDJ() != null && API.getDJ().id === this.myID;
                            var waitListPos = API.getWaitListPosition();
                            var timePerSong = 0;
                            var historyArr = API.getHistory();
                            var $djButton = $('#dj-button').find('span');

                            for (var i = 0; i < historyArr.length; i++) {
                                if (historyArr[i] == null || historyArr[i].media == null || !_.isFinite(historyArr[i].media.duration)) continue;

                                if (historyArr[i].media.duration === 0 || historyArr[i].media.duration >= 600) {
                                    timePerSong += 240;
                                } else {
                                    timePerSong += historyArr[i].media.duration;
                                }

                            }

                            timePerSong = Math.round(timePerSong / historyArr.length);

                            if (isDJ) {
                                this.$span.text(p3Lang.i18n('eta.alreadyDJ'));

                                return;
                            }

                            if (waitListPos < 0) {
                                time = p3Utils.formatTime((API.getWaitList().length * timePerSong) + API.getTimeRemaining());
                                this.$span.text(p3Lang.i18n('eta.joinTime', time));
                                $djButton.html((booth.attributes && booth.attributes.isLocked ? Lang.dj.boothLocked : (API.getWaitList().length < 50 ? Lang.dj.waitJoin : Lang.dj.waitFull)) + '<br><small class="dark-label">ETA: ' + time + '!</small>');

                                return;
                            }

                            time = p3Utils.formatTime((waitListPos * timePerSong) + API.getTimeRemaining());
                            this.$span.text(p3Lang.i18n('eta.waitListTime', waitListPos + 1, API.getWaitList().length, time), 10);
                            $djButton.html(Lang.dj.waitLeave + '<br><small class="dark-label">' + (waitListPos + 1) + '/' + API.getWaitList().length + ' (' + time + ')</small>');
                        } else if (this.$span != null) {
                            this.$span.remove();
                            this.$span = null;
                        }
                    },
                    close: function() {
                        if (this.$span != null) {
                            this.$span.remove();
                            this.$span = null;
                        }
                        this._super();
                        $('#your-next-media').find('.song').removeClass('song');
                    }
                });
            } catch (e) {
                console.error('Error while creating ETATimer');
                console.error(e);
            }

            return handler;
        });

        define('plugCubed/Tickers', ['plugCubed/Class', 'plugCubed/tickers/AFKTimer', 'plugCubed/tickers/ETATimer'], function() {
            var modules, Class, instances;

            modules = _.toArray(arguments);
            Class = modules.shift();
            instances = [];

            var Handler = Class.extend({
                register: function() {
                    this.unregister();
                    for (var i = 0; i < modules.length; i++) {
                        instances[i] = new modules[i]();
                    }
                },
                unregister: function() {
                    for (var i = 0; i < modules.length; i++) {
                        if (instances[i]) {
                            instances[i].close();
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/dialogs/panels/Background', ['plugCubed/Class', 'plugCubed/dialogs/ControlPanel', 'plugCubed/StyleManager', 'plugCubed/RoomSettings'], function(Class, ControlPanel, Styles, RoomSettings) {
            var Handler, $contentDiv, $formDiv, $localFileInput, $clearButton, panel;

            // TODO: add in submit button
            Handler = Class.extend({
                register: function() {
                    panel = ControlPanel.addPanel('Background');

                    $contentDiv = $('<div>').append($('<p>').text('Set your own room background.'));

                    panel.addContent($contentDiv);

                    $formDiv = $('<div>').width(500).css('margin', '25px auto auto auto');

                    if (window.File && window.FileReader && window.FileList && window.Blob) {
                        $localFileInput = ControlPanel.inputField('url', undefined, 'URL To Background').change(function(e) {

                            if (e.target.value != null) {
                                Styles.set('room-settings-background-image', '.room-background { background: url(' + e.target.value + ') fixed center center / cover !important; }');
                                $clearButton.changeSubmit(true);

                                return;
                            }
                            $clearButton.changeSubmit(false);
                        });

                        $clearButton = ControlPanel.button('Clear', false, function() {
                            RoomSettings.execute();
                            $clearButton.changeSubmit(false);
                        });

                        $formDiv.append($localFileInput.getJQueryElement()).append($clearButton.getJQueryElement());
                    } else {
                        $formDiv.append('Sorry, your browser does not support this');
                    }

                    panel.addContent($formDiv);
                },
                close: function() {
                    ControlPanel.removePanel(panel);

                    $contentDiv = $formDiv = $localFileInput = panel = null;
                }
            });

            return new Handler();
        });

        define('plugCubed/dialogs/panels/Notifications', ['plugCubed/Class', 'plugCubed/dialogs/ControlPanel'], function(Class, ControlPanel) {
            var Handler, $contentDiv, panel;

            Handler = Class.extend({
                register: function() {
                    panel = ControlPanel.addPanel('Notifications');

                    $contentDiv = $('<div>').append($('<p>').text('Control which notifications you want and how you want them.'));

                    panel.addContent($contentDiv);
                },
                close: function() {
                    ControlPanel.removePanel(panel);
                }
            });

            return new Handler();
        });

        define('plugCubed/dialogs/panels/Panels', ['plugCubed/Class', 'plugCubed/dialogs/panels/Background', 'plugCubed/dialogs/panels/Notifications'], function() {
            var modules, Class, Handler;

            modules = _.toArray(arguments);
            Class = modules.shift();

            Handler = Class.extend({
                register: function() {
                    this.unregister();
                    for (var i in modules) {
                        if (modules.hasOwnProperty(i) && !modules[i].registered) {
                            modules[i].register();
                        }
                    }
                },
                unregister: function() {
                    for (var i in modules) {
                        if (modules.hasOwnProperty(i) && modules[i].registered) {
                            modules[i].close();
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/overrides/RoomUserListRow', ['jquery', 'plugCubed/Lang', 'plugCubed/Utils', 'plugCubed/RoomSettings'], function($, p3Lang, p3Utils, RoomSettings) {
            var Context, CurrentUser, RoomUserListRow, RoomUsersListView;

            Context = window.plugCubedModules.context;
            CurrentUser = window.plugCubedModules.CurrentUser;
            RoomUsersListView = window.plugCubedModules.RoomUsersListView;
            RoomUserListRow = RoomUsersListView.prototype.RowClass;

            return RoomUserListRow.extend({
                vote: function() {
                    if (this.model.get('grab') || this.model.get('vote') !== 0) {
                        if (!this.$icon) {
                            this.$icon = $('<i>').addClass('icon');
                            this.$el.append(this.$icon);
                        }
                        var isStaff = (CurrentUser.hasPermission(API.ROLE.BOUNCER) || CurrentUser.hasPermission(API.ROLE.BOUNCER, true) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador());

                        if (this.model.get('grab')) {
                            this.$icon.removeClass().addClass('icon icon-grab');
                        } else if (this.model.get('vote') === 1) {
                            this.$icon.removeClass().addClass('icon icon-woot');
                        } else if (this.model.get('vote') === -1 && (isStaff || (!isStaff && RoomSettings.rules.allowShowingMehs))) {
                            this.$icon.removeClass().addClass('icon icon-meh');
                        } else {
                            this.$icon.removeClass();
                        }
                    } else if (this.$icon) {
                        this.$icon.remove();
                        this.$icon = undefined;
                    }

                    var id = this.model.get('id');
                    var $voteIcon = this.$el.find('.icon-woot,.icon-meh,.icon-grab');

                    if (p3Utils.havePlugCubedRank(id) || p3Utils.hasPermission(id, API.ROLE.DJ)) {
                        var $icon = this.$el.find('.icon:not(.icon-woot,.icon-meh,.icon-grab)');
                        var specialIconInfo = p3Utils.getPlugCubedSpecial(id);

                        if ($icon.length < 1) {
                            $icon = $('<i>').addClass('icon');
                            this.$el.append($icon);
                        }

                        if (p3Utils.havePlugCubedRank(id)) {
                            $icon.removeClass('icon-chat-subscriber');
                            $icon.removeClass('icon-chat-silver-subscriber');
                            $icon.addClass('icon-chat-p3' + p3Utils.getHighestRank(id));
                        }

                        $icon.mouseover(function() {
                            Context.trigger('tooltip:show', $('<span>').html(p3Utils.getAllPlugCubedRanks(id)).text(), $(this), true);
                        }).mouseout(function() {
                            Context.trigger('tooltip:hide');
                        });

                        if (specialIconInfo != null) {
                            $icon.css('background-image', 'url("https://plugcubed.net/scripts/release/icons.p3special.' + specialIconInfo.icon + '.png")');
                        }
                    }

                    if ($voteIcon.length > 0) {
                        $voteIcon.mouseover(function() {
                            Context.trigger('tooltip:show', $('<span>').html(p3Lang.i18n('vote.' + ($voteIcon.hasClass('icon-grab') ? 'grab' : ($voteIcon.hasClass('icon-woot') ? 'woot' : 'meh')))).text(), $(this), true);
                        }).mouseout(function() {
                            Context.trigger('tooltip:hide');
                        });
                    }
                }
            });
        });


        define('plugCubed/handlers/OverrideHandler', ['plugCubed/Class'], function(Class) {
            return Class.extend({
                init: function() {
                    this.overridden = false;
                },
                doOverride: function() {},
                doRevert: function() {},
                override: function() {
                    if (this.overridden) return;
                    this.doOverride();
                    this.overridden = true;
                },
                revert: function() {
                    if (!this.overridden) return;
                    this.doRevert();
                    this.overridden = false;
                }
            });
        });

        define('plugCubed/overrides/Context', ['plugCubed/handlers/OverrideHandler', 'plugCubed/Settings', 'plugCubed/Utils'], function(OverrideHandler, Settings, p3Utils) {
            var Context, Handler, PopoutView;

            PopoutView = window.plugCubedModules.PopoutView;
            Context = window.plugCubedModules.context;
            Handler = OverrideHandler.extend({
                doOverride: function() {
                    if (typeof Context._trigger !== 'function') {
                        Context._trigger = Context.trigger;
                    }
                    Context.trigger = function() {

                        // Code adapted from JTBrinkmann AKA Brinkie Pie
                        var $msg, socketEvents, args, $deleteMessage, deletes, userData, modUser, chat, $cm;

                        socketEvents = window.plugCubedModules.socketEvents;
                        chat = window.plugCubedModules.chat;
                        if (arguments.callee.caller === socketEvents.chatDelete && (p3Utils.hasPermission(undefined, API.ROLE.BOUNCER) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador()) && Settings.moderation.showDeletedMessages) {

                            args = arguments.callee.caller.arguments[0];
                            modUser = API.getUser(args.mi).username || args.mi;
                            console.info('[plug³ showDeletedMessages]', args.c, args.mi, args);
                            $msg = $('.text.cid-' + args.c).parent();
                            $cm = PopoutView && PopoutView.chat ? PopoutView.chat.$chatMessages : chat ? chat.$chatMessages : $('#chat-messages');

                            $deleteMessage = $('<div>')
                                .addClass('plugCubed-deleted fromID-' + args.mi)
                                .css({
                                    color: 'red',
                                    textAlign: 'right'
                                });
                            deletes = $msg.data('deletes') || {};

                            if (userData = deletes[args.mi]) { // eslint-disable-line no-cond-assign
                                $msg.find('.fromID-' + args.mi).text('deleted by ' + modUser + ' (' + ++userData.count + ')');
                            } else {
                                $deleteMessage
                                    .text('deleted by ' + modUser)
                                    .appendTo($msg);
                                deletes[args.mi] = {
                                    count: 1
                                };
                            }

                            $msg
                                .data({
                                    deletes: deletes
                                })
                                .css({
                                    opacity: 0.8
                                });

                            $msg.parent().find('.delete-button').remove();

                            if ($msg.position().top < $cm.height()) {
                                $cm.scrollTop($cm.scrollTop() + $deleteMessage.height());
                            }

                            if (chat.lastText && chat.lastText.hasClass('cid-' + args.c)) {
                                chat.lastType = 'plugCubed-deleted';
                                chat.lastID = chat.lastText = chat.lastTime = null;
                            }
                        } else {
                            return this._trigger.apply(this, arguments);
                        }
                    };

                },
                doRevert: function() {
                    if (typeof Context._trigger === 'function') {
                        Context.trigger = Context._trigger;
                    }

                }
            });

            return new Handler();
        });


        define('plugCubed/overrides/UserRolloverView', ['jquery', 'plugCubed/handlers/OverrideHandler', 'plugCubed/Utils'], function($, OverrideHandler, p3Utils) {
            var CurrentUser, Handler, UserRolloverView;

            CurrentUser = window.plugCubedModules.CurrentUser;
            UserRolloverView = window.plugCubedModules.userRollover;
            Handler = OverrideHandler.extend({
                doOverride: function() {
                    if (typeof UserRolloverView._showSimple !== 'function') {
                        UserRolloverView._showSimple = UserRolloverView.showSimple;
                    }

                    if (typeof UserRolloverView._clear !== 'function') {
                        UserRolloverView._clear = UserRolloverView.clear;
                    }

                    UserRolloverView.showSimple = function(a, b) {
                        this._showSimple(a, b);
                        var specialIconInfo = p3Utils.getPlugCubedSpecial(a.id);

                        if (p3Utils.hasPermission(a.id, API.ROLE.COHOST) && !p3Utils.hasPermission(a.id, API.ROLE.HOST) && !p3Utils.hasPermission(a.id, API.ROLE.BOUNCER, true)) {
                            this.$roleIcon.removeClass().addClass('icon icon-chat-cohost');
                        }
                        if (CurrentUser.hasPermission(API.ROLE.BOUNCER) || CurrentUser.hasPermission(API.ROLE.BOUNCER, true) || p3Utils.isPlugCubedDeveloper() || p3Utils.isPlugCubedAmbassador()) {
                            if (this.$voteID == null) {
                                this.$voteID = $('<i>');
                            }

                            if (a.get('vote') && (a.get('vote') === 1 || a.get('vote') === -1)) {
                                var vote = a.get('vote');

                                this.$voteID.removeClass().addClass('p3VoteIcon icon icon-' + (vote === -1 ? 'meh' : 'woot'));
                                this.$meta.append(this.$voteID);
                            } else {
                                this.$voteID.remove();
                            }
                        }

                        if (this.$p3UserID == null) {
                            this.$p3UserID = $('<span>').addClass('p3UserID');
                        }
                        if (CurrentUser.get('gRole') === 0) {
                            this.$p3UserID.text('User ID: ' + a.id);
                            this.$meta.append(this.$p3UserID);
                        } else {
                            this.$p3UserID.remove();
                        }

                        if (p3Utils.havePlugCubedRank(a.id)) {
                            if (this.$p3Role == null) {
                                this.$p3Role = $('<span>').addClass('p3Role');
                                this.$meta.append(this.$p3Role);
                            }

                            this.$meta.addClass('has-p3Role is-p3' + p3Utils.getHighestRank(a.id));
                            if (specialIconInfo != null) {
                                this.$p3Role.text($('<span>').html(specialIconInfo.title).text()).css({
                                    'background-image': 'url("https://plugcubed.net/scripts/release/images/icons.p3special.' + specialIconInfo.icon + '.png")'
                                });
                            } else {
                                this.$p3Role.text($('<span>').html(p3Utils.getHighestRankString(a.id)).text());
                            }
                        }
                    };

                    UserRolloverView.clear = function() {
                        this._clear();
                        if (this.$p3Role != null) {
                            this.$p3Role.empty();
                        }
                        if (this.$p3UserID != null) {
                            this.$p3UserID.empty();
                        }
                        if (this.$p3VoteIcon != null) {
                            this.$p3VoteIcon.empty();
                        }
                        this.$meta.removeClass('has-p3Role is-p3developer is-p3sponsor is-p3special is-p3ambassador is-p3donatorDiamond is-p3donatorPlatinum is-p3donatorGold is-p3donatorSilver is-p3donatorBronze');
                    };
                },
                doRevert: function() {
                    if (typeof UserRolloverView._showSimple === 'function') {
                        UserRolloverView.showSimple = UserRolloverView._showSimple;
                    }

                    if (typeof UserRolloverView._clear === 'function') {
                        UserRolloverView.clear = UserRolloverView._clear;
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/overrides/WaitListRow', ['jquery', 'plugCubed/handlers/OverrideHandler', 'plugCubed/Utils'], function($, OverrideHandler, p3Utils) {

            var WaitListRow, WaitListRowPrototype, originalFunction, Handler;

            WaitListRow = window.plugCubedModules.WaitlistRow;
            WaitListRowPrototype = WaitListRow.prototype;
            originalFunction = WaitListRowPrototype.onRole;

            Handler = OverrideHandler.extend({
                doOverride: function() {
                    WaitListRowPrototype.onRole = function() {
                        originalFunction.apply(this);
                        if (this.model.get('role') === 4) {
                            this.$('.name i').removeClass().addClass('icon icon-chat-cohost');
                        }
                    };
                },
                doRevert: function() {
                    WaitListRowPrototype.onRole = originalFunction;
                }
            });

            return new Handler();
        });

        define('plugCubed/overrides/ChatFacadeEvent', ['plugCubed/handlers/OverrideHandler', 'plugCubed/Utils'], function(OverrideHandler, p3Utils) {
            var chatFacade, Context, CurrentUser, Handler;

            chatFacade = window.plugCubedModules.chatAuxiliaries;
            Context = window.plugCubedModules.context;
            CurrentUser = window.plugCubedModules.CurrentUser;
            Handler = OverrideHandler.extend({
                doOverride: function() {
                    if (typeof chatFacade._onChatReceived !== 'function') {
                        chatFacade._onChatReceived = chatFacade.onChatReceived;
                    }
                    chatFacade.onChatReceived = function(data, internal, n) {
                        data.originalMessage = data.message;
                        if (data.message.indexOf('/me') === 0 || data.message.indexOf('/em') === 0) {
                            data.originalMessage = data.originalMessage.substr(4);
                        }
                        if (data.uid === CurrentUser.get('id')) {
                            var latestInputs = p3Utils.getUserData(-1, 'latestInputs', []);

                            latestInputs.push(p3Utils.html2text(data.message));
                            if (latestInputs.length > 10) {
                                latestInputs.splice(0, 1);
                            }
                            p3Utils.setUserData(-1, 'latestInputs', latestInputs);
                            p3Utils.setUserData(-1, 'tmpInput', null);
                        }

                        p3Utils.setUserData(data.uid, 'lastChat', Date.now());
                        Context.trigger('p3:chat:pre', data);
                        API.trigger('p3:chat:pre', data);
                        chatFacade._onChatReceived(data, internal, n);
                        Context.trigger('p3:chat:post', data);
                        API.trigger('p3:chat:post', data);

                    };

                },
                doRevert: function() {
                    if (typeof chatFacade._onChatReceived === 'function') {
                        chatFacade.onChatReceived = chatFacade._onChatReceived;
                    }

                }
            });

            return new Handler();
        });

        define('plugCubed/Overrides', ['plugCubed/Class', 'plugCubed/overrides/Context', 'plugCubed/overrides/UserRolloverView', 'plugCubed/overrides/WaitListRow', 'plugCubed/overrides/ChatFacadeEvent'], function() {
            var modules, Class, Handler;

            modules = _.toArray(arguments);
            Class = modules.shift();

            Handler = Class.extend({
                override: function() {
                    this.revert();
                    for (var i = 0; i < modules.length; i++) {
                        if (modules[i] != null) {
                            modules[i].override();
                        }
                    }
                },
                revert: function() {
                    for (var i = 0; i < modules.length; i++) {
                        if (modules[i] != null) {
                            modules[i].revert();
                        }
                    }
                }
            });

            return new Handler();
        });

        define('plugCubed/Loader', ['module', 'plugCubed/Class', 'plugCubed/Notifications', 'plugCubed/Version', 'plugCubed/StyleManager', 'plugCubed/Settings', 'plugCubed/Lang', 'plugCubed/Utils',
            'plugCubed/RoomSettings', 'plugCubed/dialogs/Menu', 'plugCubed/CustomChatColors', 'plugCubed/handlers/ChatHandler', 'plugCubed/handlers/CommandHandler', 'plugCubed/handlers/DialogHandler', 'plugCubed/handlers/FullscreenHandler', 'plugCubed/Features', 'plugCubed/Tickers', 'plugCubed/dialogs/panels/Panels', 'plugCubed/overrides/RoomUserListRow', 'plugCubed/Overrides'
        ], function(module, Class, Notifications, Version, Styles, Settings, p3Lang, p3Utils, RoomSettings, Menu, CustomChatColors, ChatHandler, CommandHandler, DialogHandler, FullscreenHandler, Features, Tickers, Panels, p3RoomUserListRow, Overrides) {
            var Loader;
            var loaded = false;
            var RoomUsersListView = window.plugCubedModules.RoomUsersListView;
            var original = RoomUsersListView.prototype.RowClass;

            function __init() {
                p3Utils.chatLog(undefined, p3Lang.i18n('running', Version) + '</span><br><span class="chat-text" style="color:#66FFFF">' + p3Lang.i18n('commandsHelp'), Settings.colors.infoMessage1, -10);

                $('head').append('<link rel="stylesheet" type="text/css" id="plugcubed-css" href="https://plugcubed.net/scripts/release/plugCubed.css?v=' + Version.getSemver() + '"/>');
                var users = API.getUsers();

                for (var i = 0; i < users.length; i++) {
                    if (p3Utils.getUserData(users[i].id, 'joinTime', -1) < 0) {
                        p3Utils.setUserData(users[i].id, 'joinTime', Date.now());
                    }
                }
                RoomUsersListView.prototype.RowClass = p3RoomUserListRow;
                Overrides.override();

                initBody();
                window.plugCubed.version = Version.getSemver();
                window.plugCubed.emotes = {
                    twitchEmotes: [],
                    twitchSubEmotes: [],
                    tastyEmotes: [],
                    bttvEmotes: [],
                    customEmotes: [],
                    emoteHash: {},
                    rcsEmotes: []
                };
                window.thedark1337 = window.plugCubed.thedark1337 =
                    '\n▄▄▄█████▓ ██░ ██ ▓█████ ▓█████▄  ▄▄▄       ██▀███   ██ ▄█▀   ██ ▓▀████▄ ▓▀████▄ ▒▀████▄' +
                    '\n▓  ██▒ ▓▒▓██░ ██▒▓█   ▀ ▒██▀ ██▌▒████▄    ▓██ ▒ ██▒ ██▄█▒    ██ ░  ▒░ █ ░  ▒░ █    ░▒▓██' +
                    '\n▒ ▓██░ ▒░▒██▀▀██░▒███   ░██   █▌▒██  ▀█▄  ▓██ ░▄█ ▒▓███▄░    ██   ▄▄▄█    ▄▄▄█       ██' +
                    '\n░ ▓██▓ ░ ░▓█ ░██ ▒▓█  ▄ ░▓█▄   ▌░██▄▄▄▄██ ▒██▀▀█▄  ▓██ █▄    ██       █       █     ██' +
                    '\n  ▒██▒ ░ ░▓█▒░██▓░▒████▒░▒████▓  ▓█   ▓██▒░██▓ ▒██▒▒██▒ █▄   ██  ▄████▀  ▄████▀    ██' +
                    '\n  ▒ ░░    ▒ ░░▒░▒░░ ▒░ ░ ▒▒▓  ▒  ▒▒   ▓▒█░░ ▒▓ ░▒▓░▒ ▒▒ ▓▒   ▓▒   ░▓ ▒    ░▓ ▒     ░░ ' +
                    '\n    ░     ▒ ░▒░ ░ ░ ░  ░ ░ ▒  ▒   ▒   ▒▒ ░  ░▒ ░ ▒░░ ░▒ ▒░   ▒░   ░▒ ░    ░▒ ░     ░' +
                    '\n  ░       ░  ░░ ░   ░    ░ ░  ░   ░   ▒     ░░   ░ ░ ░░ ░    ░     ░ ░     ░ ░' +
                    '\n          ░  ░  ░   ░  ░   ░          ░  ░   ░     ░  ░            ░       ░  ' +
                    '\n                         ░                                           ░       ░ ' +
                    '\n                                                                                       ';
                Features.register();
                Notifications.register();
                Tickers.register();
                CommandHandler.register();
                ChatHandler.register();
                FullscreenHandler.create();

                Settings.load();

                RoomSettings.update();
                if (p3Utils.getRoomID() === 'tastycat') RoomSettings.rules.allowShowingMehs = false;

                Panels.register();
                DialogHandler.register();

                loaded = true;

                if (typeof console.timeEnd === 'function') console.timeEnd('[plug³] Loaded');
            }

            function initBody() {
                var rank = p3Utils.getRank();

                if (rank === 'dj') rank = 'residentdj';
                $('body').addClass('rank-' + rank).addClass('id-' + API.getUser().id);
            }

            Loader = Class.extend({
                init: function() {
                    if (loaded) return;

                    // Define UserData in case it's not already defined (reloaded p3 without refresh)
                    if (typeof window.plugCubedUserData === 'undefined') {
                        window.plugCubedUserData = {};
                    }

                    // Load language and begin script after language loaded
                    p3Lang.load($.proxy(__init, this));
                },
                close: function() {
                    if (!loaded) return;

                    Menu.close();
                    RoomSettings.close();
                    Features.unregister();
                    Notifications.unregister();
                    Tickers.unregister();
                    Panels.unregister();
                    Styles.destroy();
                    ChatHandler.close();
                    FullscreenHandler.close();
                    CommandHandler.close();
                    DialogHandler.close();

                    RoomUsersListView.prototype.RowClass = original;
                    Overrides.revert();

                    var mainClass = module.id.split('/')[0];
                    var modules = Object.keys(require.s.contexts._.defined);

                    for (var i = 0, j = modules.length; i < j; i++) {
                        if (modules[i] && p3Utils.startsWith(modules[i], mainClass)) {
                            requirejs.undef(modules[i]);
                        }
                    }

                    $('#plugcubed-css,#p3-settings-wrapper').remove();

                    plugCubed = undefined;
                }
            });

            return Loader;
        });



        require(['plugCubed/Loader'], function(Loader) {
            window.plugCubed = new Loader();
            if (typeof console.time === 'function') console.time('[plug³] Loaded')
        });
    } else {
        setTimeout(loading, 20);
    }

    function isLoaded() {
        return window.require && window.define && window.API && window.jQuery && window.jQuery('#room').length > 0;
    }
})();}