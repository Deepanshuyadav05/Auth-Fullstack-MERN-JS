class ApiResponse {
    //     The `static` keyword defines a method or property that belongs to the class itself rather than to any specific object (instance) created from that class using new
    //     It is used when we want some value before creation of the object

    //static property for 'ok' response
    static ok(res, message, data) {
        return res.status(200).json({
            success: true,
            message: message,
            data: data
        })
    }

    //static property for 'created' response
    static created(res, message, data = null) {
        return res.status(201).json({
            success: true,
            message: message,
            data: data
        })
    }

    //static property for 'no-content' response
    static noContent(res) {
        return res.status(204).send()
    }
}

export default ApiResponse;