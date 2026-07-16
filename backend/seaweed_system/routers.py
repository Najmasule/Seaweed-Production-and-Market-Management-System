class MicroserviceDatabaseRouter:
    """
    Router inayoelekeza kila app kwenda kwenye database yake husika,
<<<<<<< HEAD
    huku ikiruhusu app ya farmers kuwepo default kwa ajili ya usajili na login (Auth/Admin).
=======
    huku ikiruhusu app za auth na contenttypes kuwepo kwenye database zote
    ili kuzuia makosa ya 'relation does not exist' wakati wa ManyToMany relationships.
>>>>>>> 36422b4 (Initial commit for main branch)
    """
    
    # Programu za mfumo wa Django zenyewe
    SYSTEM_APPS = ['admin', 'auth', 'contenttypes', 'sessions', 'messages']

    def db_for_read(self, model, **hints):
        app_label = model._meta.app_label
        
        if app_label in self.SYSTEM_APPS:
            return 'default'
<<<<<<< HEAD
        # Ikiwa ni model ya farmers, kwanza jaribu kuisoma kwenye default (kwa ajili ya Auth/Admin)
        elif app_label == 'farmers':
            return 'default'
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
=======
        
        # Ikiwa ni model ya farmers au traders, kwanza jaribu kuisoma kwenye default (kwa ajili ya Auth/Admin)
        elif app_label in ['farmers', 'traders']:
            return 'default'
            
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
            
>>>>>>> 36422b4 (Initial commit for main branch)
        return None

    def db_for_write(self, model, **hints):
        app_label = model._meta.app_label
        
        if app_label in self.SYSTEM_APPS:
            return 'default'
<<<<<<< HEAD
        # Hakikisha taarifa za wakulima/watumiaji zinaandikwa pia kwenye default ili waweze ku-login
        elif app_label == 'farmers':
            return 'default'
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
=======
            
        # Hakikisha taarifa za wakulima na wafanyabiashara (traders) zinaandikwa pia kwenye default ili waweze ku-login
        elif app_label in ['farmers', 'traders']:
            return 'default'
            
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return app_label
            
>>>>>>> 36422b4 (Initial commit for main branch)
        return None

    def allow_relation(self, obj1, obj2, **hints):
        # Ruhusu uhusiano (relationships/ForeignKeys) kati ya database tofauti
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
<<<<<<< HEAD
        if app_label in self.SYSTEM_APPS:
            return db == 'default'
        
        # Hapa ndipo panapomaliza tatizo: tunaruhusu majedwali ya farmers yaandikwe kwenye 'farmers' na 'default'
        elif app_label == 'farmers':
            return db in ['farmers', 'default']
            
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return db == app_label
=======
        # Hapa ndipo tunapomaliza tatizo: 
        # Tunaruhusu auth na contenttypes kuhamia kwenye default na pia kwenye traders database
        if app_label in ['auth', 'contenttypes']:
            return db in ['default', 'traders', 'farmers']
            
        elif app_label in ['admin', 'sessions', 'messages']:
            return db == 'default'
        
        # Inaruhusu majedwali ya farmers yaandikwe kwenye 'farmers' na 'default'
        elif app_label == 'farmers':
            return db in ['farmers', 'default']
            
        # Inaruhusu majedwali ya traders yaandikwe kwenye 'traders' na 'default'
        elif app_label == 'traders':
            return db in ['traders', 'default']
            
        elif app_label in ['production', 'market', 'inventory', 'reports']:
            return db == app_label
            
>>>>>>> 36422b4 (Initial commit for main branch)
        return None