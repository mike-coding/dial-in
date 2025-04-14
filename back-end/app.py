from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ---------------------------
# Models
# ---------------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    # One-to-one relationship with UserData
    data = db.relationship('UserData', backref='user', uselist=False)

    def to_dict(self):
        return {"id": self.id, "username": self.username}

class UserData(db.Model):
    __tablename__ = 'user_data'
    # Use the same primary key as the User id
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    completed_tutorial = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
        }

with app.app_context():
    db.create_all()

# ---------------------------
# Routes
# ---------------------------
@app.route('/')
def index():
    return jsonify(message="Flask API is running.")

# Registration endpoint (now returns complete user data)
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify(error="Invalid payload"), 400

    existing_user = User.query.filter_by(username=data['username']).first()
    if existing_user:
        return jsonify(error="Username already exists"), 400

    new_user = User(username=data['username'], password=data['password'])
    db.session.add(new_user)
    db.session.flush()  # Get new_user.id without committing yet

    # Create associated UserData for this new user
    new_user_data = UserData(id=new_user.id, completed_tutorial=False)
    db.session.add(new_user_data)
    db.session.commit()

    # Return full user data including UserData and nested varmints
    result = new_user.to_dict()
    result["data"] = new_user.data.to_dict() if new_user.data else {}
    return jsonify(result), 201

# Login endpoint (now returns complete user data)
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify(error="Invalid payload"), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user:
        return jsonify(error="User not found"), 404

    if user.password != data['password']:
        return jsonify(error="Incorrect password"), 401

    # Return full user data including UserData and nested varmints
    result = user.to_dict()
    result["data"] = user.data.to_dict() if user.data else {}
    return jsonify(result), 200

# Endpoint to get a user's full data (user + userdata + nested varmints)
@app.route('/userdata/<int:user_id>', methods=['GET'])
def get_userdata(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found"), 404
    if not user.data:
        return jsonify(error="UserData not found"), 404

    result = user.to_dict()
    result['data'] = user.data.to_dict()
    return jsonify(result), 200

@app.route('/userdata/<int:user_id>', methods=['PUT'])
def update_userdata(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify(error="User not found"), 404
    if not user.data:
        return jsonify(error="UserData not found"), 404

    data = request.get_json()

    db.session.commit()
    updated_data = user.data.to_dict()
    return jsonify(updated_data), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
