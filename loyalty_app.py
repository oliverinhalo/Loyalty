"""
Loyalty Card App — Kivy
Android-ready loyalty points manager.

Config is read from loyalty_config.json next to this file:
    {
        "base_url": "https://your-server.com",
        "api_key":  "your-secret-key"
    }

Requirements:
    pip install kivy requests
"""

import json
import os
import threading

import requests
from kivy.animation import Animation
from kivy.app import App
from kivy.clock import Clock
from kivy.core.window import Window
from kivy.graphics import Color, RoundedRectangle
from kivy.metrics import dp, sp
from kivy.properties import NumericProperty, StringProperty
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.gridlayout import GridLayout
from kivy.uix.label import Label
from kivy.uix.popup import Popup
from kivy.uix.screenmanager import ScreenManager, Screen, SlideTransition
from kivy.uix.textinput import TextInput
from kivy.uix.widget import Widget

# ── Config ─────────────────────────────────────────────────────────────────────
_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "loyalty_config.json")

def _load_config():
    defaults = {"base_url": "http://localhost:5000", "api_key": ""}
    if os.path.exists(_CONFIG_PATH):
        try:
            with open(_CONFIG_PATH) as f:
                loaded = json.load(f)
            defaults.update(loaded)
        except Exception:
            pass
    return defaults

CONFIG = _load_config()
BASE_URL = CONFIG["base_url"].rstrip("/")
API_KEY  = CONFIG["api_key"]

# ── Palette ────────────────────────────────────────────────────────────────────
C_BG       = (0.07, 0.07, 0.10, 1)
C_CARD     = (0.12, 0.12, 0.17, 1)
C_ACCENT   = (0.29, 0.85, 0.60, 1)
C_ACCENT2  = (0.18, 0.55, 0.38, 1)
C_DANGER   = (0.95, 0.35, 0.35, 1)
C_TEXT     = (0.95, 0.95, 0.95, 1)
C_SUBTEXT  = (0.55, 0.55, 0.65, 1)
C_INPUT_BG = (0.17, 0.17, 0.23, 1)
C_BORDER   = (0.25, 0.25, 0.32, 1)

Window.clearcolor = C_BG


# ── Helpers ────────────────────────────────────────────────────────────────────
def _auth_headers():
    h = {}
    if API_KEY:
        h["X-API-Key"] = API_KEY
    return h


def api_call(method, path, on_success, on_error):
    """Fire an API request on a background thread, callback on main thread."""
    def run():
        try:
            url = BASE_URL + path
            if method == "GET":
                r = requests.get(url, headers=_auth_headers(), timeout=8)
            else:
                r = requests.post(url, headers=_auth_headers(), timeout=8)
            r.raise_for_status()
            data = r.json()
            Clock.schedule_once(lambda dt: on_success(data))
        except requests.exceptions.ConnectionError:
            Clock.schedule_once(lambda dt: on_error("Cannot reach server.\nCheck your config."))
        except requests.exceptions.Timeout:
            Clock.schedule_once(lambda dt: on_error("Request timed out."))
        except requests.exceptions.HTTPError as e:
            msg = str(e)
            try:
                msg = e.response.json().get("detail", msg)
            except Exception:
                pass
            Clock.schedule_once(lambda dt: on_error(msg))
        except Exception as e:
            Clock.schedule_once(lambda dt: on_error(str(e)))
    threading.Thread(target=run, daemon=True).start()


# ── Reusable Widgets ───────────────────────────────────────────────────────────
class StyledButton(Button):
    def __init__(self, bg=C_ACCENT, text_color=(0.05, 0.05, 0.05, 1),
                 radius=12, **kwargs):
        super().__init__(**kwargs)
        self.background_normal = ""
        self.background_down   = ""
        self.background_color  = (0, 0, 0, 0)
        self.color             = text_color
        self.font_size         = sp(15)
        self.bold              = True
        self._bg               = bg
        self._radius           = radius
        self.bind(pos=self._draw, size=self._draw)

    def _draw(self, *_):
        self.canvas.before.clear()
        with self.canvas.before:
            Color(*self._bg)
            RoundedRectangle(pos=self.pos, size=self.size,
                             radius=[dp(self._radius)])

    def on_press(self):
        Animation(background_color=(0, 0, 0, 0.15), duration=0.05).start(self)

    def on_release(self):
        Animation(background_color=(0, 0, 0, 0), duration=0.1).start(self)


class StyledInput(TextInput):
    def __init__(self, **kwargs):
        kwargs.setdefault("font_size", sp(16))
        kwargs.setdefault("padding", [dp(14), dp(12)])
        kwargs.setdefault("multiline", False)
        super().__init__(**kwargs)
        self.background_normal  = ""
        self.background_active  = ""
        self.background_color   = (0, 0, 0, 0)
        self.foreground_color   = C_TEXT
        self.cursor_color       = C_ACCENT
        self.hint_text_color    = [*C_SUBTEXT[:3], 0.8]
        self.bind(pos=self._draw, size=self._draw)

    def _draw(self, *_):
        self.canvas.before.clear()
        with self.canvas.before:
            Color(*C_BORDER)
            RoundedRectangle(
                pos=(self.x - dp(1), self.y - dp(1)),
                size=(self.width + dp(2), self.height + dp(2)),
                radius=[dp(11)]
            )
            Color(*C_INPUT_BG)
            RoundedRectangle(pos=self.pos, size=self.size, radius=[dp(10)])


def make_label(text="", size=15, color=C_TEXT, bold=False, halign="left", **kw):
    l = Label(text=text, font_size=sp(size), color=color, bold=bold,
              halign=halign, **kw)
    l.bind(size=lambda inst, v: setattr(inst, "text_size", v))
    return l


def _card_bg(widget, radius=18, color=C_CARD):
    with widget.canvas.before:
        Color(*color)
        rect = RoundedRectangle(pos=widget.pos, size=widget.size,
                                radius=[dp(radius)])
    widget.bind(pos=lambda i, v: setattr(rect, "pos", v),
                size=lambda i, v: setattr(rect, "size", v))


# ── Popup helpers ──────────────────────────────────────────────────────────────
def show_popup(title, message, accent=C_ACCENT):
    content = BoxLayout(orientation="vertical", padding=dp(20), spacing=dp(16))
    _card_bg(content, 16)
    msg_lbl = make_label(message, size=14, color=C_TEXT, halign="center")
    msg_lbl.size_hint_y = None
    msg_lbl.height = dp(60)
    btn = StyledButton(text="OK", size_hint=(1, None), height=dp(44), bg=accent)
    content.add_widget(msg_lbl)
    content.add_widget(btn)
    popup = Popup(title=title, content=content,
                  size_hint=(0.85, None), height=dp(220),
                  separator_color=accent, title_color=accent,
                  background="", background_color=(0, 0, 0, 0))
    btn.bind(on_release=popup.dismiss)
    popup.open()


def show_input_popup(title, hint, on_confirm, accent=C_ACCENT):
    content = BoxLayout(orientation="vertical", padding=dp(20), spacing=dp(14))
    _card_bg(content, 16)
    inp = StyledInput(hint_text=hint, input_filter="int",
                      size_hint=(1, None), height=dp(48))
    row = BoxLayout(spacing=dp(10), size_hint=(1, None), height=dp(44))
    cancel_btn = StyledButton(text="Cancel", bg=C_INPUT_BG, text_color=C_SUBTEXT)
    ok_btn     = StyledButton(text="Confirm", bg=accent,
                              text_color=(0.05, 0.05, 0.05, 1))
    row.add_widget(cancel_btn)
    row.add_widget(ok_btn)
    content.add_widget(inp)
    content.add_widget(row)
    popup = Popup(title=title, content=content,
                  size_hint=(0.85, None), height=dp(220),
                  separator_color=accent, title_color=accent,
                  background="", background_color=(0, 0, 0, 0))
    cancel_btn.bind(on_release=popup.dismiss)

    def confirm(_):
        val = inp.text.strip()
        if val:
            popup.dismiss()
            on_confirm(val)
        else:
            inp.hint_text = "⚠ Enter a value first"

    ok_btn.bind(on_release=confirm)
    popup.open()


# ── Screen 1: Card ID Entry ────────────────────────────────────────────────────
class LoginScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        root = BoxLayout(orientation="vertical", padding=dp(32), spacing=dp(24))

        header = BoxLayout(orientation="vertical", spacing=dp(6),
                           size_hint=(1, None), height=dp(110))
        header.add_widget(make_label("◈", size=52, color=C_ACCENT,
                                     halign="center", bold=True))
        header.add_widget(make_label("LoyaltyCard", size=26, color=C_TEXT,
                                     halign="center", bold=True))
        header.add_widget(make_label("Tap your card or enter ID below",
                                     size=13, color=C_SUBTEXT, halign="center"))

        card = BoxLayout(orientation="vertical", padding=dp(24), spacing=dp(16))
        _card_bg(card)

        id_label = make_label("Card ID", size=12, color=C_SUBTEXT, bold=True)
        id_label.size_hint = (1, None)
        id_label.height = dp(20)

        self.card_input = StyledInput(hint_text="e.g. A1B2C3D4",
                                      size_hint=(1, None), height=dp(52))

        self.status_lbl = make_label("", size=12, color=C_DANGER, halign="center")
        self.status_lbl.size_hint = (1, None)
        self.status_lbl.height = dp(20)

        self.load_btn = StyledButton(text="Load Card  →",
                                     size_hint=(1, None), height=dp(52),
                                     bg=C_ACCENT,
                                     text_color=(0.05, 0.05, 0.05, 1))
        self.load_btn.bind(on_release=self.load_card)

        card.add_widget(id_label)
        card.add_widget(self.card_input)
        card.add_widget(self.status_lbl)
        card.add_widget(self.load_btn)

        nfc_hint = make_label("📡  NFC tap support coming soon",
                              size=11, color=C_SUBTEXT, halign="center")
        nfc_hint.size_hint = (1, None)
        nfc_hint.height = dp(24)

        root.add_widget(Widget())
        root.add_widget(header)
        root.add_widget(card)
        root.add_widget(nfc_hint)
        root.add_widget(Widget())
        self.add_widget(root)

    def load_card(self, *_):
        card_id = self.card_input.text.strip()
        if not card_id:
            self.status_lbl.text = "Please enter a card ID."
            return
        self.status_lbl.text = ""
        self.load_btn.text = "Loading…"
        self.load_btn.disabled = True

        def on_success(data):
            self.load_btn.text = "Load Card  →"
            self.load_btn.disabled = False
            app = App.get_running_app()
            app.card_id = card_id
            app.points  = data.get("points", 0)
            self.manager.transition = SlideTransition(direction="left")
            self.manager.current = "dashboard"

        def on_error(msg):
            self.load_btn.text = "Load Card  →"
            self.load_btn.disabled = False
            self.status_lbl.text = msg

        api_call("GET", f"/view/{card_id}", on_success, on_error)


# ── Screen 2: Dashboard ────────────────────────────────────────────────────────
class DashboardScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._root = BoxLayout(orientation="vertical",
                               padding=dp(20), spacing=dp(16))
        self.add_widget(self._root)

    def on_enter(self):
        self._root.clear_widgets()
        self._build()

    def _build(self):
        app = App.get_running_app()

        topbar = BoxLayout(size_hint=(1, None), height=dp(44), spacing=dp(8))
        back_btn = StyledButton(text="← Back", bg=C_INPUT_BG,
                                text_color=C_SUBTEXT,
                                size_hint=(None, 1), width=dp(90))
        back_btn.bind(on_release=self._go_back)
        topbar.add_widget(back_btn)
        topbar.add_widget(make_label(f"#{app.card_id}", size=13,
                                     color=C_ACCENT, bold=True, halign="right"))

        balance_card = BoxLayout(orientation="vertical",
                                 padding=dp(28), spacing=dp(4),
                                 size_hint=(1, None), height=dp(160))
        _card_bg(balance_card, 20, C_ACCENT2)

        bal_sub = make_label("CURRENT BALANCE", size=11,
                             color=(0.85, 1, 0.90, 0.75), halign="center",
                             bold=True)
        bal_sub.size_hint = (1, None)
        bal_sub.height = dp(22)

        self.points_lbl = make_label(str(app.points), size=62,
                                     color=C_TEXT, halign="center", bold=True)

        pts_word = make_label("points", size=14,
                              color=(0.85, 1, 0.90, 0.75), halign="center")
        pts_word.size_hint = (1, None)
        pts_word.height = dp(22)

        balance_card.add_widget(bal_sub)
        balance_card.add_widget(self.points_lbl)
        balance_card.add_widget(pts_word)

        actions_title = make_label("Actions", size=13, color=C_SUBTEXT, bold=True)
        actions_title.size_hint = (1, None)
        actions_title.height = dp(28)

        grid = GridLayout(cols=2, spacing=dp(10),
                          size_hint=(1, None), height=dp(210))

        btns = [
            ("＋ 1 Point",  C_ACCENT,               (0.05,0.05,0.05,1), lambda _: self._add_points(1)),
            ("＋ Custom",   (0.20, 0.70, 0.50, 1),   (0.05,0.05,0.05,1), lambda _: self._prompt_custom("add")),
            ("－ Remove",   (0.25, 0.25, 0.32, 1),   C_TEXT,             lambda _: self._prompt_custom("remove")),
            ("↺  Reset",    C_DANGER,                C_TEXT,             lambda _: self._confirm_reset()),
            ("✎  Set Value",(0.30, 0.30, 0.40, 1),   C_TEXT,             lambda _: self._prompt_custom("set")),
            ("⟳  Refresh",  (0.17, 0.17, 0.23, 1),   C_SUBTEXT,          lambda _: self._refresh()),
        ]
        for text, bg, tc, cb in btns:
            b = StyledButton(text=text, bg=bg, text_color=tc)
            b.bind(on_release=cb)
            grid.add_widget(b)

        self.feedback_lbl = make_label("", size=13, color=C_ACCENT,
                                       halign="center")
        self.feedback_lbl.size_hint = (1, None)
        self.feedback_lbl.height = dp(24)

        for w in (topbar, balance_card, actions_title,
                  grid, self.feedback_lbl, Widget()):
            self._root.add_widget(w)

    # ── API actions ─────────────────────────────────────────────────────────────
    def _refresh(self):
        app = App.get_running_app()
        self._set_feedback("Refreshing…", C_SUBTEXT)
        api_call("GET", f"/view/{app.card_id}",
                 lambda d: self._update_points(d, "Refreshed!"),
                 lambda e: self._set_feedback(e, C_DANGER))

    def _add_points(self, n):
        app = App.get_running_app()
        self._set_feedback(f"Adding {n}…", C_SUBTEXT)
        api_call("POST", f"/add/{app.card_id}/{n}",
                 lambda d: self._update_points(d, f"✓ Added {n} point{'s' if n != 1 else ''}"),
                 lambda e: self._set_feedback(e, C_DANGER))

    def _prompt_custom(self, action):
        titles  = {"add": "Add Points", "remove": "Remove Points", "set": "Set Balance"}
        accents = {"add": C_ACCENT, "remove": C_DANGER, "set": (0.55, 0.55, 0.85, 1)}
        verbs   = {"add": "Added", "remove": "Removed", "set": "Set to"}

        def confirm(val):
            n = int(val)
            app = App.get_running_app()
            self._set_feedback("Updating…", C_SUBTEXT)
            api_call("POST", f"/{action}/{app.card_id}/{n}",
                     lambda d: self._update_points(d, f"✓ {verbs[action]} {n}",
                                                   accents[action]),
                     lambda e: self._set_feedback(e, C_DANGER))

        show_input_popup(titles[action], "Enter amount", confirm, accents[action])

    def _confirm_reset(self):
        content = BoxLayout(orientation="vertical", padding=dp(20), spacing=dp(14))
        _card_bg(content, 16)
        msg = make_label("Reset balance to 0?\nThis cannot be undone.",
                         size=14, color=C_TEXT, halign="center")
        msg.size_hint = (1, None)
        msg.height = dp(60)
        row = BoxLayout(spacing=dp(10), size_hint=(1, None), height=dp(44))
        cancel_btn  = StyledButton(text="Cancel", bg=C_INPUT_BG, text_color=C_SUBTEXT)
        confirm_btn = StyledButton(text="Reset",  bg=C_DANGER,   text_color=C_TEXT)
        row.add_widget(cancel_btn)
        row.add_widget(confirm_btn)
        content.add_widget(msg)
        content.add_widget(row)
        popup = Popup(title="⚠ Confirm Reset", content=content,
                      size_hint=(0.85, None), height=dp(220),
                      separator_color=C_DANGER, title_color=C_DANGER,
                      background="", background_color=(0, 0, 0, 0))
        cancel_btn.bind(on_release=popup.dismiss)

        def do_reset(_):
            popup.dismiss()
            app = App.get_running_app()
            self._set_feedback("Resetting…", C_SUBTEXT)
            api_call("POST", f"/set/{app.card_id}/0",
                     lambda d: self._update_points(d, "✓ Balance reset to 0", C_DANGER),
                     lambda e: self._set_feedback(e, C_DANGER))

        confirm_btn.bind(on_release=do_reset)
        popup.open()

    def _update_points(self, data, msg, color=C_ACCENT):
        pts = data.get("points", 0)
        App.get_running_app().points = pts
        self.points_lbl.text = str(pts)
        self._set_feedback(msg, color)

    def _set_feedback(self, msg, color=C_ACCENT):
        self.feedback_lbl.text = msg
        self.feedback_lbl.color = color
        Clock.schedule_once(lambda dt: setattr(self.feedback_lbl, "text", ""), 3)

    def _go_back(self, *_):
        self.manager.transition = SlideTransition(direction="right")
        self.manager.current = "login"


# ── App ────────────────────────────────────────────────────────────────────────
class LoyaltyApp(App):
    card_id = StringProperty("")
    points  = NumericProperty(0)

    def build(self):
        self.title = "LoyaltyCard"
        sm = ScreenManager()
        sm.add_widget(LoginScreen(name="login"))
        sm.add_widget(DashboardScreen(name="dashboard"))
        return sm


if __name__ == "__main__":
    LoyaltyApp().run()
