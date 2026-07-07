({
    doInit: function(component, event, helper) {
        var pageRef = component.get("v.pageReference");
        if (pageRef && pageRef.state && pageRef.state.c__recordId) {
            component.set("v.accountId", pageRef.state.c__recordId);
        }
    }
})