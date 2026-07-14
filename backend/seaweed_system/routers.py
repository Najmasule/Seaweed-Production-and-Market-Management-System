class MicroserviceDatabaseRouter:
    """
    Router inayoelekeza kila app kwenda kwenye database yake husika,
    huku ikiruhusu app ya farmers kuwepo default kwa ajili ya usajili na login (Auth/Admin).
    """
    
    # Programu za mfumo wa Django zenyewe
    SYSTEM_APPS = ['admin', 'auth', 'contenttypes', 'sessions', 'messages']

    def db_for_read(self, model, **hints):
        app_label = model._meta.app_label
        
        if app_label in self.SYSTEM_APPS:
            return 'default'
        # Ikiwa ni model ya farmers, kwanza jaribu kuisoma kwenye default (kwa ajili ya Auth/Admin)
        elif app_label == 'farmers':
            return 'default'
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
        return None

    def db_for_write(self, model, **hints):
        app_label = model._meta.app_label
        
        if app_label in self.SYSTEM_APPS:
            return 'default'
        # Hakikisha taarifa za wakulima/watumiaji zinaandikwa pia kwenye default ili waweze ku-login
        elif app_label == 'farmers':
            return 'default'
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
        return None

    def allow_relation(self, obj1, obj2, **hints):
        # Ruhusu uhusiano (relationships/ForeignKeys) kati ya database tofauti
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.SYSTEM_APPS:
            return db == 'default'
        
        # Hapa ndipo panapomaliza tatizo: tunaruhusu majedwali ya farmers yaandikwe kwenye 'farmers' na 'default'
        elif app_label == 'farmers':
            return db in ['farmers', 'default']
            
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return db == app_label
        return None