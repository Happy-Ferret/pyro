/* -*- mode: C++; c-basic-offset: 4; indent-tabs-mode: nil; -*- */

#include <nsCOMPtr.h>
#include <nsCOMArray.h>
#define MOZILLA_INTERNAL_API
#include <nsRefPtrHashtable.h>
#undef MOZILLA_INTERNAL_API
#include <nsIWidget.h>

#include "compzillaIControl.h"
#include "compzillaWindow.h"

extern "C" {
#include <gdk/gdkwindow.h>
#include <X11/Xlib.h>
}


class compzillaControl
    : public compzillaIControl
{
public:
    NS_DECL_ISUPPORTS
    NS_DECL_COMPZILLAICONTROL

    compzillaControl ();
    virtual ~compzillaControl ();

private:
    already_AddRefed<compzillaWindow> FindWindow (Window win);

    void AddWindow (Window win);
    void DestroyWindow (Window win);
    void ForgetWindow (Window win);
    void MapWindow (Window win, bool override_redirect);
    void UnmapWindow (Window win);
    void WindowConfigured (bool isNotify,
                           Window win,
                           PRInt32 x, PRInt32 y,
                           PRInt32 width, PRInt32 height,
                           PRInt32 border,
                           Window aboveWin,
                           bool override_redirect);
    void PropertyChanged (Window win, Atom prop, bool deleted);
    void WindowDamaged (Window win, XRectangle *rect);
    void ClientMessaged (Window win, Atom type, int format, long *data/*[5]*/);

    GdkWindow *GetNativeWindow(nsIDOMWindow *window);
    nsresult GetNativeWidget(nsIDOMWindow *window, nsIWidget **widget);

    bool InitXAtoms ();
    bool InitXExtensions ();
    bool InitOutputWindow ();
    bool InitManagerWindow ();
    bool InitWindowState ();

    void ShowOutputWindow ();
    void HideOutputWindow ();

    GdkFilterReturn Filter (GdkXEvent *xevent, GdkEvent *event);

    static GdkFilterReturn gdk_filter_func (GdkXEvent *xevent, 
                                            GdkEvent *event, 
                                            gpointer data);
    static int ErrorHandler (Display *, XErrorEvent *);
    static int ClearErrors (Display *dpy);
    static int sErrorCnt;

    GdkDisplay *mDisplay;
    Display *mXDisplay;

    GdkWindow *mRoot;
    GdkWindow *mMainwin;
    Window mMainwinParent;
    Window mOverlay;

    Window mManagerWindow;
    bool mIsWindowManager;
    bool mIsCompositor;

    nsCOMPtr<nsIDOMWindow> mDOMWindow;
    nsRefPtrHashtable<nsUint32HashKey, compzillaWindow> mWindowMap;
    nsCOMArray<compzillaIControlObserver> mObservers;

    static int composite_event, composite_error;
    static int xevie_event, xevie_error;
    static int damage_event, damage_error;
    static int xfixes_event, xfixes_error;
    static int shape_event, shape_error;
    static int render_event, render_error;
};
