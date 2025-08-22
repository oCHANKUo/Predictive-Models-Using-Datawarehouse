from threading import Thread

# Import the apps from your model files
from sales_model import app as sales_app
from region_sales_model import app as region_app
from product_demand_model import app as product_app
from customer_purchase_model import app as customer_app

def run_sales():
    sales_app.run(port=5000)

def run_region():
    region_app.run(port=5001)

def run_product():
    product_app.run(port=5002)

def run_customer():
    customer_app.run(port=5003)

# Start all apps in separate threads
Thread(target=run_sales).start()
Thread(target=run_region).start()
Thread(target=run_product).start()
Thread(target=run_customer).start()
