# Graph Schema & Relationship Definitions

## Node Types
- `FILE`: Source file in code repository.
- `CLASS`: Object-oriented class or module container.
- `FUNCTION`: Executable function or method.
- `API`: Exposed REST, gRPC, or GraphQL endpoint.
- `SERVICE`: Microservice or standalone backend deployment.
- `DATABASE`: Relational, Document, or Cache persistence layer.
- `TABLE`: Database table or collection.
- `QUEUE`: Asynchronous message broker (Kafka, RabbitMQ, SQS).
- `EXTERNAL_SERVICE`: Third-party vendor API (Stripe, SWIFT, SendGrid).
- `TEST`: Unit, integration, or end-to-end regression test.
- `INCIDENT`: Historical post-mortem incident record.

## Edge Types
- `CONTAINS`: Structural containment (e.g., Service contains Class, Class contains Method). Traversable bidirectionally for blast radius bubbling.
- `CALLS`: Synchronous invocation between functions or services.
- `DEPENDS_ON`: Direct architectural dependency.
- `EXPOSES`: Service exposes API endpoint.
- `WRITES_TO`: Service writes or mutates data in database.
- `READS_FROM`: Service queries data from database.
- `PUBLISHES`: Service sends events to queue.
- `SUBSCRIBES`: Service consumes events from queue.
- `TESTS`: Test verifies component functionality.
- `AFFECTS`: Change or incident impacted component.
