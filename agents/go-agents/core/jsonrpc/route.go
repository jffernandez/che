package jsonrpc

import (
	"log"
	"sync"
)

var DefaultRouter = NewRouter()

func RegisterRoute(r Route) { DefaultRouter.Register(r) }

func RegisterRoutesGroup(rg RoutesGroup) { DefaultRouter.RegisterGroup(rg) }

func RegisterRoutesGroups(rgs []RoutesGroup) { DefaultRouter.RegisterGroups(rgs) }

// Route defines named operation and its handler.
type Route struct {

	// Method is the operation name like defined by Request.Method.
	Method string

	// DecoderFunc used for decoding raw request parameters
	// into the certain object. If decoding is okay, then
	// decoded value will be passed to the HandlerFunc
	// of this request route, so it is up to the route
	// - to define type safe couple of DecoderFunc & HandlerFunc.
	DecoderFunc func(body []byte) (interface{}, error)

	// HandlerFunc handler for decoded request parameters.
	// If handler function can't perform the operation then
	// handler function should either return an error, or
	// send it directly within transmitter#SendError func.
	// Params is a value returned from the DecoderFunc.
	HandlerFunc func(params interface{}, t ResponseTransmitter)
}

func (r Route) Decode(params []byte) (interface{}, error) { return r.DecoderFunc(params) }

func (r Route) Handle(params interface{}, rt ResponseTransmitter) { r.HandlerFunc(params, rt) }

// RoutesGroup is named group of rpc routes
type RoutesGroup struct {
	// The name of this group e.g.: 'ProcessRPCRoutes'
	Name string

	// Rpc routes of this group
	Items []Route
}

type Router struct {
	mutex  sync.RWMutex
	routes map[string]Route
}

func NewRouter() *Router {
	return &Router{routes: make(map[string]Route)}
}

func (r *Router) Register(route Route) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	r.routes[route.Method] = route
}

func (r *Router) RegisterGroup(group RoutesGroup) {
	for _, route := range group.Items {
		r.Register(route)
	}
}

func (r *Router) RegisterGroups(groups []RoutesGroup) {
	for _, group := range groups {
		r.RegisterGroup(group)
	}
}

func (r *Router) GetMethodHandler(method string) (MethodHandler, bool) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	route, ok := r.routes[method]
	return route, ok
}

// PrintRoutes prints provided rpc routes by group
func PrintRoutes(rg []RoutesGroup) {
	log.Print("⇩ Registered RPCRoutes:\n\n")
	for _, group := range rg {
		log.Printf("%s:\n", group.Name)
		for _, route := range group.Items {
			log.Printf("✓ %s\n", route.Method)
		}
	}
}
