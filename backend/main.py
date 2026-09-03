from flask import Flask
from flask_cors import CORS
from routes.quiz import quiz_bp
from routes.summary import summary_bp
from routes.explanation import explanation_bp
from routes.vocabulary import vocabulary_bp
from routes.flashcards import flashcards_bp
app = Flask(__name__)

CORS(app)
app.register_blueprint(vocabulary_bp)
app.register_blueprint(summary_bp)
app.register_blueprint(flashcards_bp)
app.register_blueprint(explanation_bp)
app.register_blueprint(quiz_bp)

@app.route("/")
def home():
    return {
        "message": "YouMentor AI Backend Running 🚀"
    }


if __name__ == "__main__":
    app.run(debug=True)