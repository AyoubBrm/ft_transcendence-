import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { Router } from '../../services/Router.js'
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { makeAuthRequest } from '../../services/utils.js';

const width = window.innerWidth
const height = window.innerHeight

// {
// 	"username": "berrim",
// 	"type": "2",
// 	"userScore": 4,
// 	"botScore": 5
// }
let data_to_send = {
	username: "",
	type: "3",
	userScore: 0,
	botScore: 0
}

let response = await makeAuthRequest('/api/auth/me', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
	},
	credentials: 'include',
});

if (response.ok) {
	let data = await response.json();
	//console.log('full data: ', data)
	data_to_send.username = data.username
}
else {
	//console.log('Error fetching user data');
	Router.findRoute('/');
}


//Ball

const GRAVITY = 9.8
const BOUNCE = 0.9
const init_vector_dir = {x: 0, y: 3.5, z: -1}
const vector_directeur = {x: 0, y: 2.5, z: -2.5}

const ball_init_pos = {x: 0, y: 0.3, z: 1}
const ball_color = 0xffffff

const paddle_speed = 0.05;


const key_W = 87;
const key_S = 83;
const key_A = 65;
const key_D = 68;
const key_UP = 38;
const key_DOWN = 40;
const key_LEFT = 37;
const key_RIGHT = 39;


// game details

let ball_bonce1 = 0
let ball_bonce2 = 0
let score1 = 0
let score2 = 0

let scene_moves = false




const paddle_position = { x: 0, y: 0.1, z: 1.3 }
const opp_paddle_position = { x: 0, y: 0.1, z: -1 }


// paddle hand details
const paddle_hand_dimensions = { radiusTop: 0.02, radiusBottom: 0.02, height: 0.13, radialSegments: 32 }
const paddle_hand_position = { x: 0, y: 0.05, z: 0 }
const paddle_hand_color = 0xD5A35E
const paddle_hand_rotation = { x: 0, y: 0, z: 0 }

// paddle head details
const paddle_head_dimensions = { radiusTop: 0.1, radiusBottom: 0.1, height: 0.02, radialSegments: 32 }
const paddle_head_position = { x: 0, y: 0.17, z: 0 }
const paddle_head_color = 0xff0000
const paddle_head_rotation = { x: 1.55, y: 0, z: 0 }



// Cube details
const table_dimensions = { x: 1.52, y: 0.03, z: 2.74 }
const table_position = { x: 0, y: 0, z: 0 }
const table_rotation = { x: 0, y: 0, z: 0 }

const net_dimensions = { x: table_dimensions.x, y: 0.152, z: 0.03 }
const net_position = { x: 0, y: 0.06, z: 0 }
const net_rotation = { x: 0, y: 0, z: 0 }

// light details
const light_position = { x: 10, y: 10, z: -10 }
const light_color = 0xffffff
const light_intensity = 0.3

// Camera details
const camera_position = { x: 0, y: 1, z: 3 }
//some good camera positions
//{ x: 0, y: 1, z: 3 }
//{x: -0.0034280941894782343, y: 0.6036275962200779, z: 2.6432065525610726}
//{x: -0.024363862923210137, y: 0.8729448110023423, z: 2.521385087432608}
const camera_fov = 50
const camera_aspect = width / height
const camera_near = 0.1
const camera_far = 100

// plane details
// const plane_color = 0xffffff
// const plane_dimensions = { x: 100, y: 20 }

// sphere details
// const sphere_dimensions = { radius: 1, widthSegments: 32, heightSegments: 32 }
// const sphere_position = { x: 0, y: 0, z: 0 }
// const sphere_color = 0xff0000

const point_light_position = { x: 10, y: 5, z: 5 }



const scene_color = 0x000000


function init_scene(scene_color)
{
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(scene_color)

	return scene
}

// Creating a cube
function create_cube (cube_dimensions, cube_position, cube_rotation, cube_color)
{
	const geometry = new THREE.BoxGeometry(cube_dimensions.x, cube_dimensions.y, cube_dimensions.z)
	const material = new THREE.MeshStandardMaterial({ color: cube_color })
	const cube = new THREE.Mesh(geometry, material)
	cube.position.set(cube_position.x, cube_position.y, cube_position.z)
	cube.rotation.set(cube_rotation.x, cube_rotation.y, cube_rotation.z)
	cube.castShadow = true
	cube.receiveShadow = true
	scene.add(cube)
	return cube
}

function create_net(net_dimensions, net_position, net_rotation, net_color)
{
	const geometry = new THREE.BoxGeometry(net_dimensions.x, net_dimensions.y, net_dimensions.z)
	const material = new THREE.MeshStandardMaterial({ color: net_color, opacity: 0.7, transparent : true})
	const net = new THREE.Mesh(geometry, material)
	net.position.set(net_position.x, net_position.y, net_position.z)
	net.rotation.set(net_rotation.x, net_rotation.y, net_rotation.z)
	net.castShadow = true
	net.receiveShadow = true
	scene.add(net)
	return net

}

function create_sphere(sphere_dimensions, sphere_position, sphere_color)
{
	const geometry = new THREE.SphereGeometry(sphere_dimensions.radius, sphere_dimensions.widthSegments, sphere_dimensions.heightSegments)
	const material = new THREE.MeshStandardMaterial({ color: sphere_color, transparent : true})
	const sphere = new THREE.Mesh(geometry, material)
	sphere.position.set(sphere_position.x, sphere_position.y, sphere_position.z)
	sphere.castShadow = true
	sphere.receiveShadow = true
	scene.add(sphere)
	return sphere
}

// Creating a light
function create_light(light_position, light_color, light_intensity, point_light_position)
{
	const ambientLight = new THREE.AmbientLight(light_color, light_intensity)
	scene.add(ambientLight)

	const light = new THREE.DirectionalLight(light_color, light_intensity)
	const pointLight = new THREE.PointLight(light_color, 0.8)
	pointLight.position.set(point_light_position.x, point_light_position.y, point_light_position.z)
	scene.add(pointLight)
	light.position.set(light_position.x, light_position.y, light_position.z)
	light.castShadow = true
	light.shadow.mapSize.width = 512
	light.shadow.mapSize.height = 512
	light.shadow.camera.near = 0.5
	light.shadow.camera.far = 100
	scene.add(light)
	return {light: light, point_light_position: pointLight.position, ambientLight: ambientLight}
}

function camera_init(camera_position, fov, aspect, near, far)
{
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
	camera.position.set(camera_position.x, camera_position.y, camera_position.z)
	return camera
}

function light_helper(light)
{
	const helper = new THREE.DirectionalLightHelper(light)
	scene.add(helper)
	return helper
}

function create_plane(plane_position, plane_color, plane_dimensions)
{
	const planeGeometry = new THREE.PlaneGeometry(plane_dimensions.x, plane_dimensions.y)
	const plane = new THREE.Mesh(planeGeometry, new THREE.MeshPhongMaterial({ color: plane_color }))
	plane.rotateX(-Math.PI / 2)  // rotate the plane to be horizontal
	plane.position.y = plane_position.y
	plane.receiveShadow = true
	scene.add(plane)
	return plane
}

function create_renderer(width, height)
{
	const renderer = new THREE.WebGLRenderer()
	renderer.setSize(width, height)
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	return renderer
}

function create_table_cadre (cube_dimensions, cube_position, cube_rotation, cube_color)
{
	const middle_line_dimensions = { x: cube_dimensions.x / 100, y: cube_dimensions.y, z: cube_dimensions.z }
	const middle_line_position = { x: cube_position.x, y: cube_position.y, z: cube_position.z }
	const middle_line  = create_cube(middle_line_dimensions, middle_line_position, cube_rotation, cube_color)
	scene.add(middle_line)

	const front_line_dimensions = { x: cube_dimensions.x + 0.015, y: cube_dimensions.y, z: cube_dimensions.z / 100 }
	const front_line_position = { x: cube_position.x , y: cube_position.y, z: cube_position.z + table_dimensions.z / 2}
	const front_line  = create_cube(front_line_dimensions, front_line_position, cube_rotation, cube_color)
	scene.add(front_line)


	const left_side_line_dimensions = {...middle_line_dimensions}
	const left_side_line_position = { x: cube_position.x - table_dimensions.x / 2, y: cube_position.y, z: cube_position.z }

	const left_side_line  = create_cube(left_side_line_dimensions, left_side_line_position, cube_rotation, cube_color)
	scene.add(left_side_line)

	const right_side_line_dimensions = {...middle_line_dimensions}
	const right_side_line_position = { x: cube_position.x + table_dimensions.x / 2, y: cube_position.y, z: cube_position.z }

	const right_side_line  = create_cube(right_side_line_dimensions, right_side_line_position, cube_rotation, cube_color)
	scene.add(right_side_line)

	const back_line_dimensions = {...front_line_dimensions}
	const back_line_position = { x: cube_position.x , y: cube_position.y , z: cube_position.z - table_dimensions.z / 2 }
	const back_line  = create_cube(back_line_dimensions, back_line_position, cube_rotation, cube_color)
	scene.add(back_line)

	return {middle_line: middle_line, front_line: front_line, left_side_line: left_side_line, right_side_line: right_side_line, back_line: back_line}
}

function create_cylinder (cylinder_dimensions, cylinder_position, cylinder_color, cylinder_rotation)
{
	const cylinder = new THREE.CylinderGeometry(cylinder_dimensions.radiusTop, cylinder_dimensions.radiusBottom, cylinder_dimensions.height, cylinder_dimensions.radialSegments)
	const material = new THREE.MeshStandardMaterial({ color: cylinder_color })
	const cylinder_mesh = new THREE.Mesh(cylinder, material)
	cylinder_mesh.position.set(cylinder_position.x, cylinder_position.y, cylinder_position.z)
	cylinder_mesh.rotation.set(cylinder_rotation.x, cylinder_rotation.y, cylinder_rotation.z)
	scene.add(cylinder_mesh)
	cylinder_mesh.castShadow = true
	cylinder_mesh.receiveShadow = true
	return cylinder_mesh
}

function create_paddle_hand (paddle_hand_dimensions, paddle_hand_position, paddle_hand_color, paddle_hand_rotation)
{
	const paddle_hand = create_cylinder(paddle_hand_dimensions, paddle_hand_position, paddle_hand_color, paddle_hand_rotation)
	return paddle_hand
}

function create_paddle_head (paddle_head_dimensions, paddle_head_position, paddle_head_color, paddle_head_rotation)
{
	const paddle_head = create_cylinder(paddle_head_dimensions, paddle_head_position, paddle_head_color, paddle_head_rotation)
	return paddle_head
}


// init Scene
const scene = init_scene(scene_color)

const camera = camera_init(camera_position, camera_fov, camera_aspect, camera_near, camera_far)
const renderer = create_renderer(width, height)
const light = create_light(light_position, light_color, light_intensity, point_light_position)
//const helper = light_helper(light)

// const axisHelper = new THREE.AxesHelper(100, 100, 100);
// scene.add(axisHelper);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.update();

//const plane = create_plane(plane_position, plane_color, plane_dimensions)
const table = create_cube(table_dimensions, table_position, table_rotation,  0x51E338)
const table_cadre = create_table_cadre(table_dimensions, table_position, table_rotation,  0xffffff)
const net = create_net(net_dimensions, net_position, net_rotation,  0xffffff) // dak l3iba li bkhit f lwest d table
//const sphere = create_sphere(sphere_dimensions, sphere_position, '#00ffff')




let ping_pong_table = new THREE.Object3D()

ping_pong_table.add (table)
ping_pong_table.add (table_cadre.middle_line)
ping_pong_table.add (table_cadre.front_line)
ping_pong_table.add (table_cadre.left_side_line)
ping_pong_table.add (table_cadre.right_side_line)
ping_pong_table.add (table_cadre.back_line)
ping_pong_table.add (net)

scene.add (ping_pong_table)

const paddle_hand = create_paddle_hand(paddle_hand_dimensions, paddle_hand_position, paddle_hand_color, paddle_hand_rotation)
const paddle_head = create_paddle_head(paddle_head_dimensions, paddle_head_position, paddle_head_color, paddle_head_rotation)

let paddle = new THREE.Object3D()
paddle.add(paddle_hand)
paddle.add(paddle_head)
scene.add(paddle)

paddle.position.set(paddle_position.x, paddle_position.y, paddle_position.z)



let opp_paddle = paddle.clone()
scene.add (opp_paddle)


opp_paddle.position.set(opp_paddle_position.x, opp_paddle_position.y, opp_paddle_position.z)


// WORLD
const world = new CANNON.World();
world.gravity.set(0, -GRAVITY,0);
world.broadphase = new CANNON.NaiveBroadphase();
world.solver.iterations = 10;

// Ball
const radius = 0.02;// m
const ballGeometry = new THREE.SphereGeometry(radius, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: ball_color });
const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
ballMesh.castShadow = true;
ballMesh.receiveShadow = true;
scene.add(ballMesh);

const ballBody = new CANNON.Body({
	mass: 1e-6, // kg
	position: new CANNON.Vec3(ball_init_pos.x, ball_init_pos.y, ball_init_pos.z), //m
	shape: new CANNON.Sphere(radius),
	material : ballMaterial,
});
// ballBody.radius = radius;
ballBody.material.restitution = BOUNCE; // bounce
world.addBody(ballBody);

const initialVelocity = new CANNON.Vec3(init_vector_dir.x, init_vector_dir.y, init_vector_dir.z);
ballBody.velocity.copy(initialVelocity);

// Table


const tableShape = new CANNON.Box(new CANNON.Vec3(2 * table_dimensions.x, 2 * table_dimensions.y, 2 * table_dimensions.z));
const tableMaterial = new CANNON.Material();
const tableBody = new CANNON.Body({
	mass: 0, // Static object
	position: new CANNON.Vec3(table_position.x, table_position.y, table_position.z),
	shape: tableShape,
	material: tableMaterial
});
tableBody.material.restitution = BOUNCE; // Adjust bounciness
world.addBody(tableBody);

// net 
const netShape = new CANNON.Box (new CANNON.Vec3(net_dimensions.x / 2, net_dimensions.y / 2, net_dimensions.z / 2))
const netMaterial = new CANNON.Material();
const netBody = new CANNON.Body({
	mass : 0,
	position : new CANNON.Vec3(net_position.x, net_position.y, net_position.z),
	shape : netShape,
	material :  netMaterial
});
net.material.restitution = BOUNCE / 2
world.addBody(netBody)


//paddle
const padleMaterial = new CANNON.Material();
const paddleBody = new CANNON.Body({
	mass: 0,
	position: new CANNON.Vec3(paddle_position.x, paddle_position.y, paddle_position.z),
	shape: new CANNON.Box(new CANNON.Vec3(paddle_head_dimensions.radiusTop, paddle_head_dimensions.height / 2, paddle_head_dimensions.radiusTop)),
	material: padleMaterial
});
world.addBody(paddleBody);

const oppPadleMaterial = new CANNON.Material();
const oppPaddleBody = new CANNON.Body({
	mass: 0,
	position: new CANNON.Vec3(opp_paddle_position.x, opp_paddle_position.y, opp_paddle_position.z),
	shape: new CANNON.Box(new CANNON.Vec3(paddle_head_dimensions.radiusTop, paddle_head_dimensions.height / 2, paddle_head_dimensions.radiusTop)),
	material: oppPadleMaterial
});
world.addBody(oppPaddleBody);




const ball_table_inter = new CANNON.ContactMaterial(ballMaterial, tableMaterial, {friction: 0.0, restitution: BOUNCE}); // intersect
world.addContactMaterial(ball_table_inter);

const ball_net_inter = new CANNON.ContactMaterial(ballMaterial, netMaterial, {friction: 0.0, restitution: BOUNCE});
world.addContactMaterial(ball_net_inter);

const paddle_ball_inter = new CANNON.ContactMaterial(ballMaterial, padleMaterial, {friction: 0.0, restitution: BOUNCE});
world.addContactMaterial(paddle_ball_inter);

// const opp_paddle_ball_inter = new CANNON.ContactMaterial(ballMaterial, oppPadleMaterial, {friction: 0.0, restitution: BOUNCE});
// world.addContactMaterial(opp_paddle_ball_inter);

///////

// x is the red
// y is the green
// z is the blue

function intersect_effect(position) {
	const particleCount = 100;
	const particles = new THREE.Geometry();
	const pMaterial = new THREE.PointsMaterial({
		color: 0xFFFFFF,
		size: 0.02,
		blending: THREE.AdditiveBlending,
		transparent: true,
	});

	for (let i = 0; i < particleCount; i++) {
		const pX = position.x + (Math.random() * 0.1 - 0.05);
		const pY = position.y + (Math.random() * 0.1 - 0.05);
		const pZ = position.z + (Math.random() * 0.1 - 0.05);
		const particle = new THREE.Vector3(pX, pY, pZ);
		particles.vertices.push(particle);
	}

	const particleSystem = new THREE.Points(particles, pMaterial);
	scene.add(particleSystem);

	setTimeout(() => {
		scene.remove(particeSystem);
	}, 500);
}

function point_inside_circle(point, centre_cercle, rayon)
{
	return ((point <= centre_cercle + rayon) && (point >= centre_cercle - rayon));
}

function inter_opp_paddle (paddle, ball)
{
	if (point_inside_circle(ball.position.z, paddle.position.z, 2 * radius) &&
		point_inside_circle(ball.position.x, paddle.position.x, paddle_head_dimensions.radiusTop) &&
		ball.position.y <= 2 * (paddle.position.y + paddle_head_dimensions.radiusTop) &&
		ball.position.y >= paddle.position.y - paddle_head_dimensions.radiusTop)
	{
		ball.velocity.z = -vector_directeur.z
		ball.velocity.x = 4 * (ball.position.x - paddle.position.x)
		ball.velocity.y = vector_directeur.y
	}
}

function inter_paddle (paddle, ball)
{
	if (point_inside_circle(ball.position.z, paddle.position.z, 2 * radius) &&
		point_inside_circle(ball.position.x, paddle.position.x, paddle_head_dimensions.radiusTop) &&
		ball.position.y <= 2 * (paddle.position.y + paddle_head_dimensions.radiusTop) &&
		ball.position.y >= paddle.position.y - paddle_head_dimensions.radiusTop)
	{
		ball.velocity.z = vector_directeur.z
		ball.velocity.x = 4 * (ball.position.x - paddle.position.x)
		ball.velocity.y = vector_directeur.y
	}
}


function check_paddle_limits ()
{
	if (paddleBody.position.z <= 0)
		paddleBody.position.z = paddle_hand_dimensions.height;
	if (oppPaddleBody.position.z >= 0)
		oppPaddleBody.position.z = -paddle_hand_dimensions.height;
}

function merge_visuals_with_phisiques()
{
	paddle.position.copy(paddleBody.position);
	paddle.quaternion.copy(paddleBody.quaternion);

	opp_paddle.position.copy(oppPaddleBody.position);
	opp_paddle.quaternion.copy(oppPaddleBody.quaternion);

	ballMesh.position.copy(ballBody.position);
	ballMesh.quaternion.copy(ballBody.quaternion);
}

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

let direction_ball = 1
function game_reset()
{
	ballBody.position.x = 0
	ballBody.position.y = ball_init_pos.y
	ballBody.position.z = 0
	ballBody.velocity.x = init_vector_dir.x
	if ((score1 + score2) % 2 == 0)
		direction_ball = -direction_ball
	ballBody.velocity.y = 3 * init_vector_dir.y / 4
	ballBody.velocity.z = direction_ball * init_vector_dir.z
	ball_bonce1 = ball_bonce2 = 0
}

function showPopupText(message, position = { x: 0, y: 1, z: 0 }, duration = 2000, color = 0xffffff)
{
    const loader = new FontLoader();
    loader.load(font_json, function (font) {
        const geometry = new TextGeometry(message, {
            font: font,
            size: 0.2,
            height: 0.05,
        });

        const material = new THREE.MeshStandardMaterial({ color: color });
        const textMesh = new THREE.Mesh(geometry, material);
        textMesh.position.set(position.x, position.y, position.z);
        scene.add(textMesh);

        // Remove text after duration
        setTimeout(() => {
            scene.remove(textMesh);
            geometry.dispose();
            material.dispose();
        }, duration);
    });
}

function game_score ()
{
	let who = -1
//	let reason = ""
	if (ballBody.position.y <= 4 * radius)
	{
		if (ballBody.position.z < 0)
		{
			ball_bonce1++
			ball_bonce2 = 0
			// //console.log ("bounce lhih");
		}
		else if (ballBody.position.z > 0)
		{
			ball_bonce2++
			ball_bonce1 = 0
			// //console.log ("bounce hna");
		}
	}
	if (ball_bonce1 >= 2 || ball_bonce2 >= 2)
	{
		//reason = "bounce twice";
		if (ball_bonce1 >= 2)
		{
			score2++
			who = 0
		}
		else if (ball_bonce2 >= 2)
		{
			who = 1
			score1++
		}
		ball_bonce1 = 0
		ball_bonce2 = 0
		//showPopupText(reason, { x: 0, y: 1, z: 0 }, 800, 0xff0000);
		load_text(font_json,
			who === 1 ? "" + score1 : "" + score2,
			who === 1 ? { x: -1.5, y: 0.5, z: 0.8 } : { x: -1.5, y: 0.5, z: -0.8 },
			{ x: 0, y: Math.PI / 2, z: 0 },
			who);
		if (score1 === 11 || score2 === 11)
		{
			showPopupText("Game Over", { x: 0, y: 1, z: 0 }, 2000, 0xff0000);
			data_to_send.userScore = score2
			data_to_send.botScore = score1
			makeAuthRequest('/api/auth/addGameBoot', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
				body: JSON.stringify(data_to_send)
			});
			// lets make the gravity of the world 0
			world.gravity.set(0, 0, 0);
			// make the ball invisible
			ballMesh.visible = false;
			sleep(2000).then(() => {
				//from '../../services/router.js' import { Router }

				Router.findRoute('/');
			});
		}	
		game_reset ()
	}
}

function createText(text, font, position, rotation)
{
    const geometry = new TextGeometry(text, {
        font: font,
        size: 0.2,
        height: 0.05,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    });

    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(geometry, material);
    textMesh.position.set(position.x, position.y, position.z);
    textMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(textMesh);
    return textMesh;
}

let font_json = '/public/game/js/fonts/League_Spartan_Regular.json';

let textMesh_collector = [null, null]

function load_text(fontPath, text, position, rotation, index)
{
	const loader = new FontLoader();
	loader.load(fontPath, function (font) {
		if (textMesh_collector[index] === null)
			textMesh_collector[index] = createText(text, font, position, rotation)
		else
			replaceTextMesh(text, font, position, rotation, index)
	});
}

function replaceTextMesh(text, font, position, rotation, index)
{
    scene.remove(textMesh_collector[index]);
    textMesh_collector[index].geometry.dispose();
    textMesh_collector[index].material.dispose();
    textMesh_collector[index] = createText(text, font, position, rotation);
}

function removeAllText()
{
	textMesh_collector.forEach(mesh => {
		if (mesh) {
			scene.remove(mesh);
			mesh.geometry.dispose();
			mesh.material.dispose();
		}
	});
	textMesh_collector = [null, null];
}


const pmremGenerator = new THREE.PMREMGenerator(renderer);

pmremGenerator.dispose();

// scene.environment = envMap;
// scene.background = envMap;
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5); // Adjust intensity
// scene.add(hemiLight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Choose tone mapping type
renderer.toneMappingExposure = 0.5; // Adjust to control overall brightness


function loadEnvironment() {
    let ftl = '/public/game/images/back.hdr';  // Your HDR file path

    return new Promise((resolve, reject) => {
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        loader.load(
            ftl,
            hdrTexture => {
                // Generate the environment map from the HDR texture
                const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;

                // Properly dispose of the original HDR texture
                hdrTexture.dispose();
                pmremGenerator.dispose();

                // Set the environment and background
                scene.background = envMap;
                scene.environment = envMap;

                resolve(); // Resolve when successful
            },
            undefined,
            error => {
                console.error('Error loading HDR texture:', error);
                reject(error); // Reject the promise if loading fails
            }
        );
    });
}


function updateCameraPosition()
{
	const targetPosition = new THREE.Vector3();
	paddle.getWorldPosition(targetPosition);
	camera.fov = 40
	camera.updateProjectionMatrix();

	targetPosition.z = camera.position.z;
	targetPosition.y = camera.position.y;
	targetPosition.x = 0;

	camera.position.lerp(targetPosition, 0.1); // Smooth movement
	camera.lookAt(paddle.position);
}

load_text(font_json, "" + score1, {x: -1.5, y: 0.5, z: 0.8}, { x: 0, y: Math.PI / 2, z: 0 }, 1)
load_text(font_json, "" + score2, {x: -1.5, y: 0.5, z: -0.8}, { x: 0, y: Math.PI / 2, z: 0 }, 0)
// Rendering the scene
let paused = false;
const KEY_SPACE = 32;

// Mini-map setup
const miniMapSize = { width: 100, height: 150 };
const miniMapCamera = new THREE.OrthographicCamera(
    -table_dimensions.x / 2, table_dimensions.x / 2,
    table_dimensions.z / 2, -table_dimensions.z / 2,
    0.1, 1000
);
miniMapCamera.position.set(0, 10, 0);
miniMapCamera.lookAt(0, 0, 0);

const miniMapRenderer = new THREE.WebGLRenderer({ alpha: true });
miniMapRenderer.setSize(miniMapSize.width, miniMapSize.height);
miniMapRenderer.domElement.style.position = 'absolute';
miniMapRenderer.domElement.style.bottom = '10px';
miniMapRenderer.domElement.style.left = '10px';
miniMapRenderer.domElement.style.border = '1px solid white';

app.root.appendChild(miniMapRenderer.domElement);

const miniMapBall = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 2, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
); // just cuz the ball is very small from the sky :)
scene.add(miniMapBall);

function updateMiniMap()
{
    miniMapBall.position.copy(ballBody.position);
    miniMapBall.position.y = 5;

    miniMapRenderer.render(scene, miniMapCamera);
}

function predictBouncePosition()
{
    if (ballBody.position.z > 0 || ballBody.velocity.z > 0)
        return null;

    const timeToReach = (opp_paddle_position.z - ballBody.position.z) / ballBody.velocity.z;
    const bounceX = ballBody.position.x + ballBody.velocity.x * timeToReach;
    let bounceY = ballBody.position.y + ballBody.velocity.y * timeToReach - 0.5 * GRAVITY * timeToReach * timeToReach;
    if (bounceY < radius)
	{
		const timeToBottom = (ballBody.position.y - radius) / (ballBody.velocity.y - 0.5 * GRAVITY * timeToReach);
		const remainingTime = timeToReach - timeToBottom;
		bounceY = radius + (ballBody.velocity.y + GRAVITY * timeToBottom) * remainingTime * BOUNCE;
	}

	return { x: bounceX, y: bounceY, z: opp_paddle_position.z };
}

function bot_paddle()
{
	const bouncePosition = predictBouncePosition();

	if (bouncePosition)
	{
		const paddleCenterY = oppPaddleBody.position.y + paddle_head_dimensions.radiusTop;

		if (Math.abs(ballBody.position.y - paddleCenterY) < 0.05)
		{
			const targetX = bouncePosition.x;
			if (targetX < oppPaddleBody.position.x - paddle_speed)
				oppPaddleBody.position.x -= paddle_speed;
			else if (targetX > oppPaddleBody.position.x + paddle_speed)
				oppPaddleBody.position.x += paddle_speed;
			else
				oppPaddleBody.position.x = targetX;

			const targetZ = bouncePosition.z
			if (targetZ < oppPaddleBody.position.z - paddle_speed)
				oppPaddleBody.position.z -= paddle_speed;
			else if (targetZ > oppPaddleBody.position.z + paddle_speed)
				oppPaddleBody.position.z += paddle_speed;
			else
				oppPaddleBody.position.z = targetZ;
			oppPaddleBody.position.x = Math.max(Math.min(oppPaddleBody.position.x, table_dimensions.x / 2), -table_dimensions.x / 2);
		}
	}
}

let lastTime;
let accumulator = 0;
const fixedTimeStep = 1 / 60; // 60 fps

function animate(time)
{
    if (paused)
		return;
    requestAnimationFrame(animate);
	// //console.log ("camera postion : ", camera.position)

    // to seconds
    const currentTime = time * 0.001;
    const deltaTime = lastTime ? (currentTime - lastTime) : 0;
    lastTime = currentTime;
    accumulator += deltaTime;

	// just to make sure the physics and the visuals are the same
    while (accumulator >= fixedTimeStep)
	{
        check_paddle_limits();
        game_score();
        world.step(fixedTimeStep);
		bot_paddle();
        inter_opp_paddle(oppPaddleBody, ballBody);
        inter_paddle(paddleBody, ballBody);
        merge_visuals_with_phisiques();
        accumulator -= fixedTimeStep;
    }
    updateMiniMap();

    if (scene_moves)
		updateCameraPosition();

    renderer.render(scene, camera);
}

function hooks(e)
{

	if (e.keyCode === KEY_SPACE)
	{
		paused = !paused;
		if (!paused)
			animate();
	}
	if (e.keyCode === key_W)
		paddleBody.position.z -= paddle_speed;
	if (e.keyCode === key_S)
		paddleBody.position.z += paddle_speed;
	if (e.keyCode === key_A)
		paddleBody.position.x -= paddle_speed;
	if (e.keyCode === key_D)
		paddleBody.position.x += paddle_speed;
	if (e.keyCode === key_UP)
		oppPaddleBody.position.z -= paddle_speed;
	if (e.keyCode === key_DOWN)
		oppPaddleBody.position.z += paddle_speed;
	if (e.keyCode === key_LEFT)
		oppPaddleBody.position.x -= paddle_speed;
	if (e.keyCode === key_RIGHT)
		oppPaddleBody.position.x += paddle_speed;
}

document.addEventListener('keydown', hooks)
document.addEventListener('keyup', function(e) {})

function onWindowResize()
{
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()

	renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize, false)

const container = document.querySelector('#threejs-container')
container.append(renderer.domElement)
renderer.render(scene, camera)
document.addEventListener('mousemove', function(event)
	{
		const mouseX = (event.clientX / (window.innerWidth)) * 2 - 1;
		const mouseY = -(event.clientY / (window.innerHeight)) * 2 + 1;

		const paddleRangeX = table_dimensions.x / 1.5;
		const paddleRangeZ = table_dimensions.z / 1.5;

		paddleBody.position.x = mouseX * paddleRangeX;
		paddleBody.position.z = -mouseY * paddleRangeZ;
	});

export function game_3d()
{
	loadEnvironment()
	animate()
	return () => {
		//console.log('Game 3D destroyed')
		document.removeEventListener('keydown', hooks)
		document.removeEventListener('mousemove', function(event) {})
		paused = true
		window.cancelAnimationFrame(animate)
	}
}
